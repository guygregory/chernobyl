import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ACESFilmicToneMapping, Color, MathUtils, PerspectiveCamera, Vector2, Vector3 } from 'three'
import { getLandmark, landmarks, SITE_BOUNDS } from '../data/landmarks'
import type { CameraCommand, LandmarkId, Quality, SiteState } from '../data/types'
import { sceneSignature, visibleLandmarkIds } from '../state/resolveSiteState'
import type { PlantSceneProps } from '../components/MapViewport'
import { BatchMesh } from './BatchMesh'
import { createSceneResources, qualitySettings } from './resources'
import { buildSiteModel } from './structures/siteModel'
import { Nsc } from './structures/Nsc'
import { diagnosticsEnabled, type AtlasDiagnostics, type OrbitMeasurement } from './diagnostics'

const DEFAULT_TARGET = new Vector3(215, 15, 65)
const DESKTOP_POSITION = new Vector3(-440, 640, 870)
const MOBILE_POSITION = new Vector3(-470, 940, 1480)

function clearOrbitInertia(orbit: OrbitControlsImpl) {
  const damping = orbit.enableDamping
  orbit.enableDamping = false
  orbit.update()
  orbit.enableDamping = damping
}

function SceneLabels({ site, selected, onSelect }: { site: SiteState; selected: LandmarkId | null; onSelect: (id: LandmarkId) => void }) {
  const { size } = useThree()
  const present = visibleLandmarkIds(site)
  const shown = landmarks.filter((entry) =>
    present.includes(entry.id) && (
      ['unit-1', 'unit-2', 'unit-3', 'nsc'].includes(entry.id)
      || entry.id === 'unit-4' && !site.shelter.exists
      || entry.id === 'shelter' && !site.nsc.exists
      || selected === entry.id && !['unit-4', 'shelter'].includes(entry.id)
    ) && (size.width > 760 || entry.id === selected || ['unit-1', 'nsc'].includes(entry.id) || entry.id === 'shelter' && !site.nsc.exists || entry.id === 'unit-4' && !site.shelter.exists),
  )
  return <group name="contextual-map-labels">{shown.map((entry) => {
    let [x, , z] = entry.position
    let height = entry.height + 15
    if (entry.id === 'nsc' && site.nsc.variant === 'assembly') x = -277
    if (entry.id === 'ventilation-stack' && site.stacks.phaseTwo === 'replacement') { x = 164; z = -43; height = 137 }
    return <Html key={entry.id} position={[x, height, z]} center zIndexRange={[10, 1]} style={{ pointerEvents: 'auto' }}>
      <button className={`scene-label ${selected === entry.id ? 'is-selected' : ''}`} aria-label={`Select ${entry.name}`} onClick={(event) => { event.stopPropagation(); onSelect(entry.id) }}>{entry.shortName}</button><div className="label-leader" />
    </Html>
  })}</group>
}

function SelectedOutline({ selected, site }: { selected: LandmarkId | null; site: SiteState }) {
  if (!selected || !visibleLandmarkIds(site).includes(selected)) return null
  const entry = getLandmark(selected)
  let [x, , z] = entry.position
  let [width, depth] = entry.footprint
  if (selected === 'nsc' && site.nsc.variant === 'assembly') x = -277
  if (selected === 'ventilation-stack' && site.stacks.phaseTwo === 'replacement') { x = 164; z = -43; width = 20; depth = 20 }
  if ((selected === 'unit-4' || selected === 'shelter') && site.nsc.construction === 'complete') {
    const arch = getLandmark('nsc')
    x = arch.position[0]; z = arch.position[2]; width = arch.footprint[0]; depth = arch.footprint[1]
  }
  return <group name="selected-landmark-outline" position={[x, .9, z]}>
    {[[-width / 2 - 4, 0], [width / 2 + 4, 0]].map(([xx, zz], i) => <mesh key={`x${i}`} position={[xx ?? 0, 0, zz ?? 0]}><boxGeometry args={[1.4, .6, depth + 8]} /><meshBasicMaterial color="#b68b3a" /></mesh>)}
    {[-depth / 2 - 4, depth / 2 + 4].map((zz) => <mesh key={zz} position={[0, 0, zz]}><boxGeometry args={[width + 9, .6, 1.4]} /><meshBasicMaterial color="#b68b3a" /></mesh>)}
  </group>
}

function CameraRig({ command, site, quality, onReady }: { command: CameraCommand; site: SiteState; quality: Quality; onReady: () => void }) {
  const { camera, gl, size, invalidate, scene } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const initialized = useRef(false)
  const presented = useRef(false)
  const frames = useRef(0)
  const lastFrame = useRef<number | null>(null)
  const benchmark = useRef<{ start: number; seconds: number; times: number[]; resolve: (value: OrbitMeasurement) => void; position: Vector3; target: Vector3; warmup: number } | null>(null)
  const benchmarkTimeout = useRef<number | null>(null)
  const diagnostic = useRef<AtlasDiagnostics | null>(null)
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  const constrain = useCallback(() => {
    const orbit = controls.current
    if (!orbit) return
    const old = orbit.target.clone()
    orbit.target.x = MathUtils.clamp(orbit.target.x, SITE_BOUNDS.minX + 110, SITE_BOUNDS.maxX - 100)
    orbit.target.z = MathUtils.clamp(orbit.target.z, SITE_BOUNDS.minZ + 105, SITE_BOUNDS.maxZ - 105)
    orbit.target.y = MathUtils.clamp(orbit.target.y, 2, 95)
    camera.position.add(orbit.target.clone().sub(old))
    invalidate()
  }, [camera, invalidate])

  useLayoutEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    if (!initialized.current) {
      camera.position.copy(size.width < 761 ? MOBILE_POSITION : DESKTOP_POSITION)
      orbit.target.copy(DEFAULT_TARGET)
      initialized.current = true
    }
    if (camera instanceof PerspectiveCamera) {
      camera.filmOffset = size.width < 761 ? 0 : 5
      camera.updateProjectionMatrix()
    }
    orbit.update()
    invalidate()
  }, [camera, size.width, invalidate])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit || !initialized.current) return
    clearOrbitInertia(orbit)
    if (command.action === 'reset') {
      camera.position.copy(size.width < 761 ? MOBILE_POSITION : DESKTOP_POSITION)
      orbit.target.copy(DEFAULT_TARGET)
    } else if (command.action === 'north') {
      orbit.target.copy(DEFAULT_TARGET)
      camera.position.set(215, 1000, 700)
    } else if (command.action === 'focus' && command.landmark) {
      const landmark = getLandmark(command.landmark)
      let [x, , z] = landmark.position
      let height = landmark.height
      let extent = Math.max(...landmark.footprint)
      if (command.landmark === 'nsc' && site.nsc.variant === 'assembly') x = -277
      if ((command.landmark === 'unit-4' || command.landmark === 'shelter') && site.nsc.construction === 'complete') {
        const arch = getLandmark('nsc')
        x = arch.position[0]; z = arch.position[2]; height = arch.height; extent = 257
      }
      if (command.landmark === 'ventilation-stack' && site.stacks.phaseTwo === 'replacement') { x = 164; z = -43; height = 125 }
      orbit.target.set(x, height * .32, z)
      const distance = Math.max(240, extent * (size.width < 761 ? 3.1 : 2.3))
      const direction = camera.position.clone().sub(orbit.target).normalize()
      if (direction.y < .3) direction.y = .5
      camera.position.copy(orbit.target).add(direction.normalize().multiplyScalar(distance))
    } else if (command.action === 'zoom-in' || command.action === 'zoom-out') {
      const delta = camera.position.clone().sub(orbit.target)
      delta.multiplyScalar(command.action === 'zoom-in' ? .82 : 1.22)
      delta.setLength(MathUtils.clamp(delta.length(), 170, 2600))
      camera.position.copy(orbit.target).add(delta)
    }
    orbit.update()
    constrain()
    // Historical updates never trigger this effect; only explicit camera commands do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command.id])

  useEffect(() => {
    const canvas = gl.domElement
    const keydown = (event: KeyboardEvent) => {
      const orbit = controls.current
      if (!orbit || event.altKey || event.ctrlKey || event.metaKey) return
      const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
      if (event.key === '+' || event.key === '=' || event.key === '-') {
        event.preventDefault()
        const delta = camera.position.clone().sub(orbit.target).multiplyScalar(event.key === '-' ? 1.15 : .87)
        delta.setLength(MathUtils.clamp(delta.length(), 170, 2600))
        camera.position.copy(orbit.target).add(delta)
      } else if (event.key === 'Home') {
        event.preventDefault()
        clearOrbitInertia(orbit)
        camera.position.copy(size.width < 761 ? MOBILE_POSITION : DESKTOP_POSITION)
        orbit.target.copy(DEFAULT_TARGET)
      } else if (arrows.includes(event.key)) {
        event.preventDefault()
        if (event.shiftKey) {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + (event.key === 'ArrowLeft' ? .12 : -.12))
          else orbit.setPolarAngle(MathUtils.clamp(orbit.getPolarAngle() + (event.key === 'ArrowUp' ? -.08 : .08), .18, 1.25))
        } else {
          const forward = camera.getWorldDirection(new Vector3()); forward.y = 0; forward.normalize()
          const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0))
          const delta = (event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? right : forward).multiplyScalar(event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -23 : 23)
          orbit.target.add(delta); camera.position.add(delta)
        }
      } else return
      orbit.update()
      constrain()
    }
    canvas.tabIndex = 0
    canvas.setAttribute('aria-label', '3D campus map. Arrow keys pan, Shift and arrows orbit, plus and minus zoom, Home resets. History is available in Field notes.')
    canvas.addEventListener('keydown', keydown)
    return () => canvas.removeEventListener('keydown', keydown)
  }, [camera, gl, size.width, constrain])

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    invalidate()
  }, [gl, site, quality, invalidate])

  useEffect(() => {
    if (!diagnosticsEnabled()) return
    const context = gl.getContext()
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    const renderer: string = debug ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : String(context.getParameter(context.RENDERER))
    const value: AtlasDiagnostics = {
      ready: false, milestoneId: site.milestoneId, signature: sceneSignature(site),
      present: visibleLandmarkIds(site), quality,
      camera: { position: camera.position.toArray(), target: controls.current?.target.toArray() ?? [] },
      renderer, info: { calls: 0, triangles: 0, geometries: 0, textures: 0, objects: 0 }, renderedFrames: 0,
      measureOrbit(seconds = 8) {
        return new Promise((resolve, reject) => {
          const orbit = controls.current
          if (!orbit) { reject(new Error('Camera controls are not ready.')); return }
          if (benchmark.current) { reject(new Error('An orbit measurement is already running.')); return }
          if (!Number.isFinite(seconds) || seconds < 2 || seconds > 60) { reject(new Error('Measurement duration must be between 2 and 60 seconds.')); return }
          benchmark.current = { start: 0, seconds, times: [], resolve, position: camera.position.clone(), target: orbit.target.clone(), warmup: 8 }
          orbit.autoRotate = true
          orbit.autoRotateSpeed = 1.4
          benchmarkTimeout.current = window.setTimeout(() => {
            if (benchmark.current) {
              orbit.autoRotate = false
              clearOrbitInertia(orbit)
              camera.position.copy(benchmark.current.position)
              orbit.target.copy(benchmark.current.target)
              benchmark.current = null
              orbit.update()
              reject(new Error('The renderer stopped presenting frames during measurement.'))
            }
          }, seconds * 1000 + 30_000)
          invalidate()
        })
      },
    }
    diagnostic.current = value
    window.__CHERNOBYL_ATLAS__ = value
    return () => {
      if (benchmarkTimeout.current !== null) window.clearTimeout(benchmarkTimeout.current)
      if (window.__CHERNOBYL_ATLAS__ === value) delete window.__CHERNOBYL_ATLAS__
    }
    // The same inspector object survives historical updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, invalidate])

  useFrame(() => {
    frames.current += 1
    if (!presented.current && frames.current >= 2) { presented.current = true; onReady() }
    const orbit = controls.current
    const value = diagnostic.current
    if (value) {
      value.ready = presented.current
      value.milestoneId = site.milestoneId
      value.signature = sceneSignature(site)
      value.present = visibleLandmarkIds(site)
      value.quality = quality
      value.camera = { position: camera.position.toArray(), target: orbit?.target.toArray() ?? [] }
      value.renderedFrames = frames.current
      let objects = 0
      scene.traverse(() => { objects += 1 })
      value.info = { calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, objects }
    }
    const measurement = benchmark.current
    const now = performance.now()
    if (measurement && orbit) {
      if (measurement.warmup > 0) { measurement.warmup -= 1; measurement.start = now }
      else {
        if (lastFrame.current !== null) measurement.times.push(now - lastFrame.current)
        if (now - measurement.start >= measurement.seconds * 1000) {
          const times = [...measurement.times].sort((a, b) => a - b)
          const drawingBuffer = gl.getDrawingBufferSize(new Vector2())
          const result: OrbitMeasurement = {
            seconds: (now - measurement.start) / 1000,
            frames: times.length,
            averageFps: times.length * 1000 / (now - measurement.start),
            medianFrameMs: times[Math.floor(times.length * .5)] ?? 0,
            p95FrameMs: times[Math.floor(times.length * .95)] ?? 0,
            viewport: [size.width, size.height], drawingBuffer: [drawingBuffer.x, drawingBuffer.y],
            quality, renderer: value?.renderer ?? 'Not available', userAgent: navigator.userAgent,
            calls: gl.info.render.calls, triangles: gl.info.render.triangles,
          }
          orbit.autoRotate = false
          clearOrbitInertia(orbit)
          camera.position.copy(measurement.position)
          orbit.target.copy(measurement.target)
          orbit.update()
          benchmark.current = null
          if (benchmarkTimeout.current !== null) window.clearTimeout(benchmarkTimeout.current)
          measurement.resolve(result)
        }
      }
      invalidate()
    }
    lastFrame.current = now
    if (frames.current < 3) invalidate()
  })

  return <OrbitControls
    ref={controls}
    makeDefault
    target={DEFAULT_TARGET}
    enableDamping={!reducedMotion}
    dampingFactor={.12}
    rotateSpeed={.65}
    panSpeed={.8}
    zoomSpeed={.7}
    minDistance={170}
    maxDistance={2600}
    minPolarAngle={.18}
    maxPolarAngle={1.25}
    onChange={constrain}
    enablePan
    screenSpacePanning={false}
    enableRotate
    enableZoom
    regress={false}
    autoRotate={false}
    keyEvents={false}
  />
}

function Campus(props: PlantSceneProps) {
  const resources = useMemo(() => createSceneResources(props.quality), [props.quality])
  const batches = useMemo(() => buildSiteModel(props.site, props.quality), [props.site, props.quality])
  const { gl } = useThree()
  const onFailure = props.onFailure
  useEffect(() => () => resources.dispose(), [resources])
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => {
      event.preventDefault()
      onFailure('The graphics context was lost. The history is preserved. Retry the 3D view to create a new context.')
    }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onFailure])
  const settings = qualitySettings[props.quality]
  return <>
    <color attach="background" args={['#c8d3bd']} />
    <fog attach="fog" args={['#c8d3bd', 2100, 4700]} />
    <hemisphereLight args={['#f4f5ec', '#819080', 1.65]} />
    <directionalLight
      position={[-250, 760, 330]}
      intensity={2.35}
      color="#fff8e9"
      castShadow={settings.shadows}
      shadow-mapSize={[settings.shadowSize, settings.shadowSize]}
      shadow-camera-left={-1000}
      shadow-camera-right={1000}
      shadow-camera-top={800}
      shadow-camera-bottom={-800}
      shadow-camera-near={1}
      shadow-camera-far={2200}
      shadow-bias={-.0002}
      shadow-normalBias={.65}
    />
    <group name="original-procedural-campus">
      {batches.map((batch) => <BatchMesh key={batch.key} batch={batch} resources={resources} onSelect={props.onSelect} />)}
    </group>
    {props.site.nsc.exists && <Nsc variant={props.site.nsc.variant} quality={props.quality} onSelect={props.onSelect} />}
    <SelectedOutline selected={props.selected} site={props.site} />
    {props.labels && <SceneLabels site={props.site} selected={props.selected} onSelect={props.onSelect} />}
    <CameraRig command={props.command} site={props.site} quality={props.quality} onReady={props.onReady} />
  </>
}

export default function PlantScene(props: PlantSceneProps) {
  return <Canvas
    frameloop="demand"
    dpr={qualitySettings[props.quality].dpr}
    shadows={qualitySettings[props.quality].shadows ? 'soft' : false}
    camera={{ position: DESKTOP_POSITION.toArray(), fov: 42, near: 1, far: 6000 }}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => {
      gl.toneMapping = ACESFilmicToneMapping
      gl.toneMappingExposure = .95
      gl.setClearColor(new Color('#c8d3bd'))
    }}
  ><Campus {...props} /></Canvas>
}
