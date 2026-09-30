import { Component, lazy, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import type { CameraCommand, LandmarkId, Quality, SiteState } from '../data/types'
import { assertSiteManifest } from '../data/validate'
import { sceneSignature, visibleLandmarkIds } from '../state/resolveSiteState'
import { Icon } from './Icon'

export interface PlantSceneProps {
  site: SiteState
  selected: LandmarkId | null
  labels: boolean
  quality: Quality
  command: CameraCommand
  onSelect: (id: LandmarkId) => void
  onReady: () => void
  onFailure: (message: string) => void
}

class SceneBoundary extends Component<{ children: ReactNode; onFailure: (message: string) => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The campus renderer failed.', error, info.componentStack)
    this.props.onFailure(`The 3D renderer could not start: ${error.message}`)
  }
  render() { return this.state.failed ? null : this.props.children }
}

function webglAvailability(): string | null {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl2')
  if (!context) return 'This browser or device does not provide WebGL 2. The complete history and landmark notes remain available.'
  context.getExtension('WEBGL_lose_context')?.loseContext()
  return null
}

export function MapViewport(props: Omit<PlantSceneProps, 'onReady' | 'onFailure'>) {
  const [renderer, setRenderer] = useState(() => ({ attempt: 0, Scene: lazy(() => import('../scene/PlantScene')) }))
  const { attempt, Scene } = renderer
  const [phase, setPhase] = useState<'loading' | 'preparing' | 'ready' | 'failed'>('loading')
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    const load = async () => {
      setPhase('loading')
      setFailure(null)
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}site-manifest.json`, { signal: controller.signal, cache: 'no-cache' })
        if (!response.ok) throw new Error(`The local geometry manifest returned HTTP ${response.status}.`)
        const manifest: unknown = await response.json()
        assertSiteManifest(manifest)
        const unavailable = webglAvailability()
        if (unavailable) throw new Error(unavailable)
        if (!cancelled) setPhase('preparing')
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return
        const message = error instanceof Error ? error.message : 'An unknown error occurred while loading the local campus data.'
        console.error('Campus loading failed:', error)
        setFailure(message)
        setPhase('failed')
      }
    }
    void load()
    return () => { cancelled = true; controller.abort() }
  }, [attempt])

  useEffect(() => {
    if (phase !== 'preparing') return
    const timeout = window.setTimeout(() => {
      setFailure('The renderer did not present a frame in time. Try again, choose Low quality, or read the history without 3D.')
      setPhase('failed')
    }, 30_000)
    return () => window.clearTimeout(timeout)
  }, [phase])

  return <section
    className="map-viewport"
    aria-label="Interactive historical plant campus"
    data-testid="map"
    data-scene-status={phase}
    data-milestone={props.site.milestoneId}
    data-scene-signature={sceneSignature(props.site)}
    data-present-landmarks={visibleLandmarkIds(props.site).join(',')}
    data-selected-landmark={props.selected ?? ''}
  >
    {(phase === 'preparing' || phase === 'ready') && <SceneBoundary key={attempt} onFailure={(message) => { setFailure(message); setPhase('failed') }}>
      <Suspense fallback={null}><Scene {...props} onReady={() => setPhase('ready')} onFailure={(message) => { setFailure(message); setPhase('failed') }} /></Suspense>
    </SceneBoundary>}
    {(phase === 'loading' || phase === 'preparing') && <div className="scene-loading" role="status" aria-live="polite">
      <img src={`${import.meta.env.BASE_URL}assets/atlas-mark.svg`} alt="" width="46" height="46" />
      <p>{phase === 'loading' ? 'Checking the campus edition' : 'Preparing the original geometry'}</p>
      <div className="loading-bar" role="progressbar" aria-label="Campus loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === 'loading' ? 20 : 70}><span style={{ width: phase === 'loading' ? '20%' : '70%' }} /></div>
      <small>Local assets only. No remote maps or model downloads.</small>
    </div>}
    {phase === 'failed' && <div className="scene-fallback" role="region" aria-labelledby="fallback-title">
      <div className="fallback-contour" aria-hidden="true" />
      <Icon name="layers" size={32} />
      <span className="eyebrow">The history is still here</span><h2 id="fallback-title">3D view unavailable.</h2>
      <p role="alert">{failure}</p>
      <button className="focus-button" onClick={() => {
        if (failure?.includes('dynamically imported module') || failure?.includes('module script')) window.location.reload()
        else setRenderer((previous) => ({ attempt: previous.attempt + 1, Scene: lazy(() => import('../scene/PlantScene')) }))
      }}><Icon name="reset" size={16} />Retry 3D view</button>
      <p className="fine-print">Use the timeline and Field notes to explore every milestone and landmark without WebGL.</p>
    </div>}
  </section>
}
