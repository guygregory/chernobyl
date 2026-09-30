import { useLayoutEffect, useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import type { LandmarkId } from '../data/types'
import type { ModelBatch } from './structures/siteModel'
import type { SceneResources } from './resources'

export function BatchMesh({ batch, resources, onSelect }: { batch: ModelBatch; resources: SceneResources; onSelect: (id: LandmarkId) => void }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4(), position = new Vector3(), scale = new Vector3(), quaternion = new Quaternion(), euler = new Euler()
    batch.parts.forEach((part, i) => {
      position.set(...part.position)
      scale.set(...part.scale)
      if (part.quaternion) quaternion.set(...part.quaternion)
      else quaternion.setFromEuler(euler.set(...(part.rotation ?? [0, 0, 0])))
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
    })
    mesh.count = batch.parts.length
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [batch])

  const select = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return
    const id = event.instanceId === undefined ? undefined : batch.parts[event.instanceId]?.landmark
    if (id) { event.stopPropagation(); onSelect(id) }
  }

  return <instancedMesh
    ref={ref}
    name={`original-${batch.key}`}
    args={[resources.geometries[batch.geometry], resources.materials[batch.material], batch.parts.length]}
    castShadow={batch.shadow}
    receiveShadow
    onClick={select}
  />
}
