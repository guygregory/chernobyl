import { describe, expect, it } from 'vitest'
import { landmarks } from '../../data/landmarks'
import { milestones } from '../../data/milestones'
import { resolveSiteState } from '../../state/resolveSiteState'
import { buildSiteModel } from './siteModel'
import { ARCH, PATCH, createArchSurface } from './archGeometry'

describe('original procedural geometry and scene identity', () => {
  it('emits finite positive geometry for every milestone without accumulated parts', () => {
    for (const { id } of milestones) {
      const state = resolveSiteState(id)
      const model = buildSiteModel(state, 'medium')
      expect(buildSiteModel(state, 'medium')).toEqual(model)
      for (const batch of model) {
        for (const part of batch.parts) {
          expect([...part.position, ...part.scale, ...(part.rotation ?? []), ...(part.quaternion ?? [])].every(Number.isFinite)).toBe(true)
          expect(part.scale.every((value) => value > 0)).toBe(true)
        }
      }
    }
  })
  it('keeps construction, Shelter, NSC and chimney parts independent', () => {
    const before = buildSiteModel(resolveSiteState('1986-before'), 'medium')
    const shelter = buildSiteModel(resolveSiteState('1986-shelter'), 'medium')
    const latest = buildSiteModel(resolveSiteState('latest-2026'), 'medium')
    const tagged = (model: ReturnType<typeof buildSiteModel>, id: string) => model.flatMap((batch) => batch.parts).filter((part) => part.landmark === id)
    expect(tagged(before, 'shelter')).toHaveLength(0)
    expect(tagged(before, 'nsc')).toHaveLength(0)
    expect(tagged(shelter, 'shelter').length).toBeGreaterThan(20)
    expect(tagged(shelter, 'nsc')).toHaveLength(0)
    expect(tagged(latest, 'shelter').length).toBeGreaterThan(20)
    expect(tagged(latest, 'nsc').length).toBeGreaterThan(20)
    expect(tagged(latest, 'ventilation-stack')).not.toEqual(tagged(before, 'ventilation-stack'))
  })
  it('reproduces nominal published NSC dimensions and distinguishes breach from patch', () => {
    const full = createArchSurface(56, false)
    const breach = createArchSurface(56, true)
    const patch = createArchSurface(56, false, true)
    const bounds = full.boundingBox
    expect(bounds).not.toBeNull()
    expect(bounds?.max.x).toBeCloseTo(ARCH.length / 2, 4)
    expect(bounds?.min.x).toBeCloseTo(-ARCH.length / 2, 4)
    expect(bounds?.max.z).toBeCloseTo(ARCH.span / 2, 4)
    expect(bounds?.max.y).toBeCloseTo(ARCH.height, 4)
    expect(breach.getAttribute('position').count).toBeLessThan(full.getAttribute('position').count)
    expect(patch.getAttribute('position').count).toBeGreaterThan(0)
    expect(full.groups).toHaveLength(5)
    expect(breach.groups).toHaveLength(5)
    expect(patch.groups).toHaveLength(1)
    expect(() => createArchSurface(0, false)).toThrow(/Arch detail/)
    for (const geometry of [full, breach, patch]) geometry.dispose()
  })
  it('quality changes contextual detail, not historical presence or arch dimensions', () => {
    const state = resolveSiteState('latest-2026')
    const low = buildSiteModel(state, 'low').flatMap((batch) => batch.parts)
    const high = buildSiteModel(state, 'high').flatMap((batch) => batch.parts)
    expect(high.length).toBeGreaterThan(low.length)
    for (const landmark of landmarks) {
      expect(low.some((part) => part.landmark === landmark.id)).toBe(high.some((part) => part.landmark === landmark.id))
    }
  })
  it('preserves every original triangle and panel material when grouping all arch variants', () => {
    for (const segments of [32, 56, 80]) {
      for (const variant of ['full', 'damaged', 'patch'] as const) {
        const patch = variant === 'patch', damaged = variant === 'damaged'
        const xCount = patch ? 3 : 20, angleCount = patch ? 5 : segments
        const x0 = patch ? PATCH.x0 - 2 : -ARCH.length / 2
        const x1 = patch ? PATCH.x1 + 2 : ARCH.length / 2
        const a0 = patch ? PATCH.theta0 - .035 : 0
        const a1 = patch ? PATCH.theta1 + .035 : Math.PI
        const expected: string[] = []
        const key = (material: number, points: readonly number[]) => `${material}:${points.map(Math.fround).join(',')}`
        for (let i = 0; i < xCount; i++) for (let j = 0; j < angleCount; j++) {
          const xa = x0 + (x1 - x0) * i / xCount, xb = x0 + (x1 - x0) * (i + 1) / xCount
          const ta = a0 + (a1 - a0) * j / angleCount, tb = a0 + (a1 - a0) * (j + 1) / angleCount
          if (damaged && xa < PATCH.x1 && xb > PATCH.x0 && ta < PATCH.theta1 && tb > PATCH.theta0) continue
          const material = patch ? 0 : (i * 3 + j) % 5
          const point = (x: number, angle: number) => [x, (ARCH.height + (patch ? .65 : 0)) * Math.sin(angle), (ARCH.span / 2 + (patch ? .65 : 0)) * Math.cos(angle)]
          expected.push(key(material, [...point(xa, ta), ...point(xb, ta), ...point(xb, tb)]))
          expected.push(key(material, [...point(xa, ta), ...point(xb, tb), ...point(xa, tb)]))
        }
        const geometry = createArchSurface(segments, damaged, patch)
        const vertices = geometry.getAttribute('position')
        const actual: string[] = []
        expect(geometry.groups.reduce((sum, group) => sum + group.count, 0)).toBe(vertices.count)
        for (const group of geometry.groups) {
          expect(group.count % 6).toBe(0)
          for (let index = group.start; index < group.start + group.count; index += 3) {
            actual.push(key(group.materialIndex ?? 0, [
              vertices.getX(index), vertices.getY(index), vertices.getZ(index),
              vertices.getX(index + 1), vertices.getY(index + 1), vertices.getZ(index + 1),
              vertices.getX(index + 2), vertices.getY(index + 2), vertices.getZ(index + 2),
            ]))
          }
        }
        expect(actual.sort()).toEqual(expected.sort())
        expect(geometry.groups).toHaveLength(patch ? 1 : 5)
        geometry.dispose()
      }
    }
  })
})
