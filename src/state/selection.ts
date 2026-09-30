import { getMilestone, isMilestoneId, LATEST_MILESTONE, milestones } from '../data/milestones'
import { isLandmarkId } from '../data/landmarks'
import type { LandmarkId, MilestoneId } from '../data/types'

export interface Selection {
  readonly milestone: MilestoneId
  readonly landmark: LandmarkId | null
}
export interface ParsedSelection {
  readonly selection: Selection
  readonly error: string | null
}
export const DEFAULT_SELECTION: Selection = { milestone: LATEST_MILESTONE, landmark: null }

export function parseSelection(hash: string, search = ''): ParsedSelection {
  const raw = hash.replace(/^#/, '') || search.replace(/^\?/, '')
  if (!raw) return { selection: DEFAULT_SELECTION, error: null }
  const params = new URLSearchParams(raw)
  const errors: string[] = []
  for (const key of params.keys()) {
    if (key !== 'milestone' && key !== 'landmark' && key !== 'diagnostics') errors.push(`Unknown link parameter "${key}".`)
    if (params.getAll(key).length !== 1) errors.push(`Link parameter "${key}" is repeated.`)
  }
  const milestone = params.get('milestone')
  const landmark = params.get('landmark')
  if (milestone !== null && !isMilestoneId(milestone)) errors.push(`Unknown milestone "${milestone}".`)
  if (landmark !== null && !isLandmarkId(landmark)) errors.push(`Unknown landmark "${landmark}".`)
  if (errors.length) return { selection: DEFAULT_SELECTION, error: `${[...new Set(errors)].join(' ')} The latest verified view is shown instead; choose a valid date or reset this link.` }
  return {
    selection: {
      milestone: milestone !== null && isMilestoneId(milestone) ? milestone : LATEST_MILESTONE,
      landmark: landmark !== null && isLandmarkId(landmark) ? landmark : null,
    },
    error: null,
  }
}

export function selectionHash(selection: Selection): string {
  const params = new URLSearchParams({ milestone: selection.milestone })
  if (selection.landmark) params.set('landmark', selection.landmark)
  return `#${params.toString()}`
}

export function adjacentMilestone(id: MilestoneId, direction: -1 | 1): MilestoneId {
  const index = milestones.findIndex((entry) => entry.id === id)
  if (index < 0) throw new Error(`Cannot navigate from unknown milestone ${id}.`)
  return milestones[Math.max(0, Math.min(milestones.length - 1, index + direction))]?.id ?? getMilestone(id).id
}
