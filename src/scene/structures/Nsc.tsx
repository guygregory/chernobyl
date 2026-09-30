import { useEffect, useMemo } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { CatmullRomCurve3, DoubleSide, MeshStandardMaterial, TubeGeometry, Vector3 } from 'three'
import { getLandmark } from '../../data/landmarks'
import type { LandmarkId, NscVariant, Quality } from '../../data/types'
import { qualitySettings } from '../resources'
import { ARCH, archPoint, createArchEnd, createArchSurface } from './archGeometry'

export function Nsc({ variant, quality, onSelect }: { variant: NscVariant; quality: Quality; onSelect: (id: LandmarkId) => void }) {
  const segments = qualitySettings[quality].archSegments
  const resources = useMemo(() => {
    const full = createArchSurface(segments, false)
    const breached = createArchSurface(segments, true)
    const patch = createArchSurface(segments, false, true)
    const end = createArchEnd(segments)
    const curve = new CatmullRomCurve3(Array.from({ length: segments + 1 }, (_, i) => new Vector3(...archPoint(0, i * Math.PI / segments, .48))))
    const rib = new TubeGeometry(curve, segments, .7, 6, false)
    const materials = ['#aebcbd', '#bbc6c6', '#b5c0c2', '#a8b8bb', '#b2bfc0'].map((color) => new MeshStandardMaterial({ color, metalness: .46, roughness: .54, side: DoubleSide }))
    const ribMaterial = new MeshStandardMaterial({ color: '#d0d6cc', metalness: .3, roughness: .48 })
    const endMaterial = new MeshStandardMaterial({ color: '#a5b8b8', metalness: .34, roughness: .65, side: DoubleSide })
    const patchMaterial = new MeshStandardMaterial({ color: '#d1ceba', metalness: .26, roughness: .75, side: DoubleSide })
    return { full, breached, patch, end, rib, materials, ribMaterial, endMaterial, patchMaterial }
  }, [segments])
  useEffect(() => () => {
    for (const geometry of [resources.full, resources.breached, resources.patch, resources.end, resources.rib]) geometry.dispose()
    for (const material of [...resources.materials, resources.ribMaterial, resources.endMaterial, resources.patchMaterial]) material.dispose()
  }, [resources])

  const { position } = getLandmark('nsc')
  const assembly = variant === 'assembly'
  const center: [number, number, number] = [assembly ? -277 : position[0], .05, position[2]]
  const select = (event: ThreeEvent<MouseEvent>) => { if (event.delta <= 5) { event.stopPropagation(); onSelect('nsc') } }
  const count = assembly ? 5 : 11
  return <group name="landmark-nsc" position={center} onClick={select}>
    {!assembly && <>
      <mesh name={variant === 'damaged' ? 'nsc-schematic-breach' : 'nsc-cladding'} geometry={variant === 'damaged' ? resources.breached : resources.full} material={resources.materials} castShadow receiveShadow />
      <mesh position={[-ARCH.length / 2, 0, 0]} geometry={resources.end} material={resources.endMaterial} castShadow receiveShadow />
      <mesh position={[ARCH.length / 2, 0, 0]} geometry={resources.end} material={resources.endMaterial} castShadow receiveShadow />
      {variant === 'patched' && <mesh name="nsc-indicative-patch" geometry={resources.patch} material={resources.patchMaterial} castShadow receiveShadow />}
    </>}
    {Array.from({ length: count }, (_, i) => <mesh key={i} position={[-81 + i * 162 / (count - 1), 0, 0]} geometry={resources.rib} material={resources.ribMaterial} castShadow receiveShadow />)}
  </group>
}
