import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

export const ARCH = { length: 162, span: 257, height: 108 } as const
export const PATCH = { x0: -65, x1: -45, theta0: .93, theta1: 1.09 } as const

export function archPoint(x: number, theta: number, offset = 0): readonly [number, number, number] {
  return [x, (ARCH.height + offset) * Math.sin(theta), (ARCH.span / 2 + offset) * Math.cos(theta)]
}

export function createArchSurface(segments: number, breached: boolean, patchOnly = false) {
  if (!Number.isInteger(segments) || segments < 8 || segments > 256) throw new Error('Arch detail must be an integer from 8 to 256 segments.')
  const geometry = new BufferGeometry()
  const buckets: { positions: number[]; normals: number[] }[] = Array.from({ length: patchOnly ? 1 : 5 }, () => ({ positions: [], normals: [] }))
  const xCount = patchOnly ? 3 : 20
  const angleCount = patchOnly ? 5 : segments
  const x0 = patchOnly ? PATCH.x0 - 2 : -ARCH.length / 2
  const x1 = patchOnly ? PATCH.x1 + 2 : ARCH.length / 2
  const a0 = patchOnly ? PATCH.theta0 - .035 : 0
  const a1 = patchOnly ? PATCH.theta1 + .035 : Math.PI
  const normal = new Vector3()
  for (let i = 0; i < xCount; i++) {
    for (let j = 0; j < angleCount; j++) {
      const xa = x0 + (x1 - x0) * i / xCount, xb = x0 + (x1 - x0) * (i + 1) / xCount
      const ta = a0 + (a1 - a0) * j / angleCount, tb = a0 + (a1 - a0) * (j + 1) / angleCount
      if (breached && xa < PATCH.x1 && xb > PATCH.x0 && ta < PATCH.theta1 && tb > PATCH.theta0) continue
      const bucket = buckets[patchOnly ? 0 : (i * 3 + j) % 5]
      if (!bucket) throw new Error('The original arch material group is missing.')
      const offset = patchOnly ? .65 : 0
      const corners: readonly (readonly [number, number])[] = [[xa, ta], [xb, ta], [xb, tb], [xa, ta], [xb, tb], [xa, tb]]
      for (const [x, t] of corners) {
        bucket.positions.push(...archPoint(x, t, offset))
        normal.set(0, Math.sin(t) / ARCH.height, Math.cos(t) / (ARCH.span / 2)).normalize()
        bucket.normals.push(normal.x, normal.y, normal.z)
      }
    }
  }
  const positions: number[] = [], normals: number[] = []
  // Preserve each panel's color, but submit one draw per material, not per panel.
  buckets.forEach((bucket, material) => {
    geometry.addGroup(positions.length / 3, bucket.positions.length / 3, material)
    positions.push(...bucket.positions)
    normals.push(...bucket.normals)
  })
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.computeBoundingSphere()
  geometry.computeBoundingBox()
  return geometry
}

export function createArchEnd(segments: number) {
  const positions: number[] = []
  for (let i = 0; i < segments; i++) {
    positions.push(0, 0, 0, ...archPoint(0, i * Math.PI / segments), ...archPoint(0, (i + 1) * Math.PI / segments))
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
