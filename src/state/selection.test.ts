import { describe, expect, it } from 'vitest'
import { milestones } from '../data/milestones'
import { adjacentMilestone, DEFAULT_SELECTION, parseSelection, selectionHash } from './selection'

describe('deep links and bounded manual navigation', () => {
  it('defaults to the latest verified milestone only on an empty link', () => {
    expect(parseSelection('')).toEqual({ selection: DEFAULT_SELECTION, error: null })
  })
  it('round-trips every valid milestone and landmark and supports query links', () => {
    for (const { id } of milestones) {
      const selection = { milestone: id, landmark: 'shelter' } as const
      expect(parseSelection(selectionHash(selection))).toEqual({ selection, error: null })
      expect(parseSelection('', `?milestone=${id}&landmark=shelter`).selection).toEqual(selection)
    }
  })
  it.each([
    '#milestone=unknown', '#landmark=pripyat', '#milestone=',
    '#milestone=latest-2026&milestone=1986-before',
    '#year=2026', '#milestone=%ZZ',
  ])('explicitly reports invalid link %s', (hash) => {
    const result = parseSelection(hash)
    expect(result.error).toBeTruthy()
    expect(result.error).toMatch(/latest verified view/)
  })
  it('does not wrap or auto-play at the timeline ends', () => {
    expect(adjacentMilestone('1972-foundations', -1)).toBe('1972-foundations')
    expect(adjacentMilestone('latest-2026', 1)).toBe('latest-2026')
    expect(adjacentMilestone('2016-nsc-position', 1)).toBe('2019-nsc-handover')
    expect(adjacentMilestone('2016-nsc-position', -1)).toBe('2013-stack')
  })
})
