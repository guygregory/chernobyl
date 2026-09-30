import { describe, expect, it } from 'vitest'
import { getMilestone, milestones } from '../data/milestones'
import { landmarks, geographicToLocal, SITE_ORIGIN } from '../data/landmarks'
import { assertSiteManifest, validateHistoricalData } from '../data/validate'
import manifest from '../../public/site-manifest.json'
import { resolveSiteState, sceneSignature, visibleLandmarkIds } from './resolveSiteState'
import { unitIds } from '../data/types'

describe('complete, immutable historical snapshots', () => {
  it('validates dates, sources, geographic anchors, IDs and historical invariants', () => {
    expect(validateHistoricalData()).toEqual([])
    expect(() => assertSiteManifest(manifest)).not.toThrow()
  })
  it('gives the same result after forward, backward and arbitrary navigation', () => {
    const baseline = new Map(milestones.map(({ id }) => [id, sceneSignature(resolveSiteState(id))]))
    const sequence = [...milestones, ...[...milestones].reverse(), ...milestones.filter((_, i) => i % 2), ...milestones.filter((_, i) => !(i % 2))]
    for (const { id } of sequence) expect(sceneSignature(resolveSiteState(id))).toBe(baseline.get(id))
  })
  it('freezes all nested records and does not share mutable reactor records', () => {
    const state = resolveSiteState('latest-2026')
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.units)).toBe(true)
    for (const id of unitIds) expect(Object.isFrozen(state.units[id])).toBe(true)
    expect(Object.isFrozen(state.nsc)).toBe(true)
    expect(Object.isFrozen(state.shelter)).toBe(true)
    expect(() => Object.assign(state.units['unit-1'], { operation: 'in-service' })).toThrow()
    expect(resolveSiteState('latest-2026').units['unit-1']).not.toBe(state.units['unit-1'])
  })
  it('has independent units and hall construction, not four identical startup states', () => {
    const state = resolveSiteState('1977-unit-1')
    expect(state.units['unit-1'].operation).toBe('grid-connected')
    expect(state.units['unit-2'].construction).toBe('frame')
    expect(state.units['unit-3'].construction).toBe('foundation')
    expect(state.units['unit-4'].exists).toBe(false)
    expect(state.turbineHalls['unit-4']).toBe('absent')
  })
  it('never operates Unit 4 after the accident, and correctly models the 1986 restart sequence', () => {
    expect(resolveSiteState('1986-before').units['unit-4'].operation).toBe('in-service')
    for (const { id } of milestones.slice(6)) expect(resolveSiteState(id).units['unit-4'].operation).toBe('destroyed')
    const november = resolveSiteState('1986-shelter')
    expect(november.units['unit-1'].operation).toBe('in-service')
    expect(november.units['unit-2'].operation).toBe('in-service')
    expect(november.units['unit-3'].operation).toBe('temporarily-stopped')
  })
  it('retains buildings at shutdown and ends generation in 2000', () => {
    for (const id of ['1991-unit-2-off', '1996-unit-1-off', '2000-last-generation'] as const) {
      const state = resolveSiteState(id)
      for (const unit of unitIds) {
        expect(state.units[unit].exists).toBe(true)
        expect(state.turbineHalls[unit]).toBe('complete')
      }
    }
    for (const { id } of milestones.slice(10)) for (const unit of unitIds) expect(resolveSiteState(id).units[unit].operation).not.toBe('in-service')
  })
  it('retains the original Shelter beneath the installed arch and distinguishes handover', () => {
    expect(resolveSiteState('1986-shelter').nsc.exists).toBe(false)
    const installed = resolveSiteState('2016-nsc-position')
    const handedOver = resolveSiteState('2019-nsc-handover')
    expect(installed.shelter.exists).toBe(true)
    expect(handedOver.shelter.exists).toBe(true)
    expect(installed.nsc.variant).toBe('installed')
    expect(handedOver.nsc.variant).toBe('handed-over')
    expect(visibleLandmarkIds(handedOver)).toContain('shelter')
    expect(visibleLandmarkIds(handedOver)).toContain('nsc')
  })
  it('shows a documented closure rather than an open hole in the latest state', () => {
    expect(resolveSiteState('2025-nsc-damage').nsc.variant).toBe('damaged')
    expect(resolveSiteState('2025-cladding-closed').nsc.variant).toBe('patched')
    expect(resolveSiteState('latest-2026').nsc.variant).toBe('patched')
    expect(getMilestone('latest-2026').date.value).toBe('2026-09-15')
    expect(getMilestone('2025-cladding-closed').date.precision).toBe('month')
    expect(sceneSignature(resolveSiteState('latest-2026'))).toBe(sceneSignature(resolveSiteState('2025-cladding-closed')))
  })
  it('has separate Shelter/NSC anchors and a documented east / south coordinate basis', () => {
    expect(geographicToLocal(SITE_ORIGIN.latitude, SITE_ORIGIN.longitude)).toEqual([0, 0, -0])
    expect(geographicToLocal(SITE_ORIGIN.latitude, SITE_ORIGIN.longitude + 0.001)[0]).toBeGreaterThan(60)
    expect(geographicToLocal(SITE_ORIGIN.latitude + 0.001, SITE_ORIGIN.longitude)[2]).toBeLessThan(-100)
    expect(landmarks.find((l) => l.id === 'shelter')?.position).not.toEqual(landmarks.find((l) => l.id === 'nsc')?.position)
  })
  it('rejects mismatched or damaged asset descriptors explicitly', () => {
    expect(() => assertSiteManifest({ ...manifest, edition: '2027-01-01' })).toThrow(/edition/)
    expect(() => assertSiteManifest({ ...manifest, assets: ['../unsafe'] })).toThrow(/asset/)
    expect(() => assertSiteManifest(null)).toThrow(/object/)
  })
})
