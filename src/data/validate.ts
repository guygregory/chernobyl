import { landmarks, SITE_BOUNDS, SITE_ORIGIN } from './landmarks'
import { getMilestone, LATEST_MILESTONE, milestones } from './milestones'
import { EDITORIAL_REVIEW, sources } from './sources'
import { landmarkIds, milestoneIds, unitIds } from './types'
import { resolveSiteState } from '../state/resolveSiteState'

function isDate(value: string, precision: 'day' | 'month' | 'year'): boolean {
  const pattern = precision === 'day' ? /^\d{4}-\d{2}-\d{2}$/ : precision === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}$/
  if (!pattern.test(value)) return false
  const full = precision === 'year' ? `${value}-01-01` : precision === 'month' ? `${value}-01` : value
  const date = new Date(`${full}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === full
}

export function validateHistoricalData(): readonly string[] {
  const errors: string[] = []
  if (milestones.length !== milestoneIds.length) errors.push('Milestone count differs from the supported IDs.')
  if (new Set(milestones.map((m) => m.id)).size !== milestones.length) errors.push('Duplicate milestone IDs.')
  if (new Set(landmarks.map((l) => l.id)).size !== landmarks.length) errors.push('Duplicate landmark IDs.')
  let previous = ''
  for (const milestone of milestones) {
    if (!isDate(milestone.date.value, milestone.date.precision)) errors.push(`${milestone.id}: invalid date or precision.`)
    const date = milestone.date.value
    if (date < previous) errors.push(`${milestone.id}: chronology is out of order.`)
    previous = date
    if (milestone.date.end && (!isDate(milestone.date.end, 'day') || milestone.date.end < date)) errors.push(`${milestone.id}: invalid end date.`)
    if (milestone.sourceIds.length === 0) errors.push(`${milestone.id}: no evidence.`)
    for (const sourceId of milestone.sourceIds) if (!(sourceId in sources)) errors.push(`${milestone.id}: unknown source ${sourceId}.`)
    const state = resolveSiteState(milestone.id)
    for (const unit of unitIds) {
      const record = state.units[unit]
      if (record.exists !== (record.construction !== 'absent')) errors.push(`${milestone.id}/${unit}: inconsistent existence.`)
      if ((record.operation === 'in-service' || record.operation === 'grid-connected') && record.construction !== 'complete') errors.push(`${milestone.id}/${unit}: operating incomplete reactor.`)
    }
    if (state.nsc.construction === 'complete' && !state.shelter.exists) errors.push(`${milestone.id}: installed NSC without original Shelter.`)
    if (date >= '1986-04-26' && !milestone.date.qualifier && state.units['unit-4'].operation !== 'destroyed') errors.push(`${milestone.id}: Unit 4 operating after accident.`)
    if (date >= '2000-12-15' && unitIds.some((unit) => state.units[unit].operation === 'in-service')) errors.push(`${milestone.id}: generation after final shutdown.`)
  }
  for (const id of milestoneIds) if (!milestones.some((m) => m.id === id)) errors.push(`Missing milestone ${id}.`)
  for (const id of landmarkIds) if (!landmarks.some((l) => l.id === id)) errors.push(`Missing landmark ${id}.`)
  for (const landmark of landmarks) {
    const [x, y, z] = landmark.position
    if (![x, y, z, ...landmark.footprint, landmark.height].every(Number.isFinite)) errors.push(`${landmark.id}: non-finite geometry.`)
    if (x < SITE_BOUNDS.minX || x > SITE_BOUNDS.maxX || z < SITE_BOUNDS.minZ || z > SITE_BOUNDS.maxZ) errors.push(`${landmark.id}: anchor outside campus.`)
    if (x - landmark.footprint[0] / 2 < SITE_BOUNDS.minX || x + landmark.footprint[0] / 2 > SITE_BOUNDS.maxX || z - landmark.footprint[1] / 2 < SITE_BOUNDS.minZ || z + landmark.footprint[1] / 2 > SITE_BOUNDS.maxZ) errors.push(`${landmark.id}: footprint outside campus.`)
    if (landmark.footprint.some((n) => n <= 0) || landmark.height <= 0) errors.push(`${landmark.id}: invalid dimensions.`)
    for (const sourceId of landmark.sourceIds) if (!(sourceId in sources)) errors.push(`${landmark.id}: unknown source ${sourceId}.`)
  }
  for (const [id, source] of Object.entries(sources)) {
    if (!URL.canParse(source.url) || new URL(source.url).protocol !== 'https:') errors.push(`${id}: source must have a valid HTTPS URL.`)
    if (!source.supports || !source.uncertainty) errors.push(`${id}: missing editorial context.`)
    if (!isDate(source.reviewed, 'day') || source.reviewed > EDITORIAL_REVIEW) errors.push(`${id}: invalid review date.`)
    if (source.published.precision !== 'undated') {
      if (!source.published.value || !isDate(source.published.value, source.published.precision)) errors.push(`${id}: invalid publication date.`)
      if (source.published.value && source.published.value > source.reviewed) errors.push(`${id}: publication after review.`)
    }
  }
  if (getMilestone(LATEST_MILESTONE).date.value > EDITORIAL_REVIEW) errors.push('Latest depicted date is after review.')
  if (resolveSiteState(LATEST_MILESTONE).nsc.variant !== 'patched') errors.push('Latest state must not show the February breach.')
  return errors
}

export interface SiteManifest {
  schemaVersion: number
  edition: string
  geometry: string
  coordinateOrigin: readonly number[]
  latestMilestone: string
  assets: readonly string[]
  notice: string
}

export function assertSiteManifest(value: unknown): asserts value is SiteManifest {
  if (!value || typeof value !== 'object') throw new Error('The local site manifest is not an object.')
  if (!('schemaVersion' in value) || value.schemaVersion !== 1) throw new Error('Unsupported site manifest version.')
  if (!('edition' in value) || value.edition !== EDITORIAL_REVIEW) throw new Error('The geometry manifest and editorial edition do not match.')
  if (!('geometry' in value) || value.geometry !== 'original-procedural-v1') throw new Error('The original geometry descriptor is missing or unsupported.')
  if (!('latestMilestone' in value) || value.latestMilestone !== LATEST_MILESTONE) throw new Error('The manifest latest milestone does not match the history.')
  if (!('coordinateOrigin' in value) || !Array.isArray(value.coordinateOrigin) || value.coordinateOrigin.length !== 2 || value.coordinateOrigin[0] !== SITE_ORIGIN.latitude || value.coordinateOrigin[1] !== SITE_ORIGIN.longitude) throw new Error('The manifest geographic origin is invalid.')
  if (!('assets' in value) || !Array.isArray(value.assets) || value.assets.length === 0 || !value.assets.every((asset: unknown) => typeof asset === 'string' && /^assets\/[a-z0-9.-]+$/.test(asset))) throw new Error('The manifest asset list is invalid.')
  if (!('notice' in value) || typeof value.notice !== 'string' || !value.notice) throw new Error('The geometry approximation notice is missing.')
}
