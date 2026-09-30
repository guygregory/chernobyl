import { type ConstructionStage, type MilestoneId, type NscVariant, type OperatingStatus, type ReactorState, type SiteState, type StackVariant, type UnitId, unitIds } from '../data/types'

type UnitSpec = readonly [ConstructionStage, OperatingStatus]
type SnapshotSpec = {
  readonly units: readonly [UnitSpec, UnitSpec, UnitSpec, UnitSpec]
  readonly shelter: 'absent' | 'original' | 'stabilized'
  readonly nsc: NscVariant
  readonly stack: StackVariant
}

const absent: UnitSpec = ['absent', 'not-built']
const foundation: UnitSpec = ['foundation', 'under-construction']
const frame: UnitSpec = ['frame', 'under-construction']
const connected: UnitSpec = ['complete', 'grid-connected']
const service: UnitSpec = ['complete', 'in-service']
const stopped: UnitSpec = ['complete', 'temporarily-stopped']
const closed: UnitSpec = ['complete', 'shutdown']
const destroyed: UnitSpec = ['complete', 'destroyed']

const specs: Readonly<Record<MilestoneId, SnapshotSpec>> = {
  '1972-foundations': { units: [foundation, absent, absent, absent], shelter: 'absent', nsc: 'absent', stack: 'absent' },
  '1977-unit-1': { units: [connected, frame, foundation, absent], shelter: 'absent', nsc: 'absent', stack: 'absent' },
  '1978-unit-2': { units: [service, connected, frame, absent], shelter: 'absent', nsc: 'absent', stack: 'absent' },
  '1981-unit-3': { units: [service, service, connected, frame], shelter: 'absent', nsc: 'absent', stack: 'original' },
  '1983-unit-4': { units: [service, service, service, connected], shelter: 'absent', nsc: 'absent', stack: 'original' },
  '1986-before': { units: [service, service, service, service], shelter: 'absent', nsc: 'absent', stack: 'original' },
  '1986-accident': { units: [stopped, stopped, stopped, destroyed], shelter: 'absent', nsc: 'absent', stack: 'original' },
  '1986-shelter': { units: [service, service, stopped, destroyed], shelter: 'original', nsc: 'absent', stack: 'original' },
  '1991-unit-2-off': { units: [service, closed, service, destroyed], shelter: 'original', nsc: 'absent', stack: 'original' },
  '1996-unit-1-off': { units: [closed, closed, service, destroyed], shelter: 'original', nsc: 'absent', stack: 'original' },
  '2000-last-generation': { units: [closed, closed, closed, destroyed], shelter: 'original', nsc: 'absent', stack: 'original' },
  '2013-stack': { units: [closed, closed, closed, destroyed], shelter: 'stabilized', nsc: 'assembly', stack: 'replacement' },
  '2016-nsc-position': { units: [closed, closed, closed, destroyed], shelter: 'stabilized', nsc: 'installed', stack: 'replacement' },
  '2019-nsc-handover': { units: [closed, closed, closed, destroyed], shelter: 'stabilized', nsc: 'handed-over', stack: 'replacement' },
  '2025-nsc-damage': { units: [closed, closed, closed, destroyed], shelter: 'stabilized', nsc: 'damaged', stack: 'replacement' },
  '2025-cladding-closed': { units: [closed, closed, closed, destroyed], shelter: 'stabilized', nsc: 'patched', stack: 'replacement' },
  'latest-2026': { units: [closed, closed, closed, destroyed], shelter: 'stabilized', nsc: 'patched', stack: 'replacement' },
}

function reactor(spec: UnitSpec, unit: UnitId): ReactorState {
  return Object.freeze({
    exists: spec[0] !== 'absent',
    construction: spec[0],
    variant: spec[1] === 'destroyed' ? 'damaged' : unit === 'unit-1' || unit === 'unit-2' ? 'first-generation' : 'second-generation',
    operation: spec[1],
  })
}

export function resolveSiteState(id: MilestoneId): SiteState {
  const spec = specs[id]
  if (!spec) throw new Error(`No complete site state for ${String(id)}.`)
  const units = Object.freeze({
    'unit-1': reactor(spec.units[0], 'unit-1'),
    'unit-2': reactor(spec.units[1], 'unit-2'),
    'unit-3': reactor(spec.units[2], 'unit-3'),
    'unit-4': reactor(spec.units[3], 'unit-4'),
  })
  return Object.freeze({
    milestoneId: id,
    units,
    turbineHalls: Object.freeze({
      'unit-1': units['unit-1'].construction,
      'unit-2': units['unit-2'].construction,
      'unit-3': units['unit-3'].construction,
      'unit-4': units['unit-4'].construction,
    }),
    shelter: Object.freeze({ exists: spec.shelter !== 'absent', variant: spec.shelter }),
    nsc: Object.freeze({ exists: spec.nsc !== 'absent', construction: spec.nsc === 'absent' ? 'absent' : spec.nsc === 'assembly' ? 'frame' : 'complete', variant: spec.nsc }),
    stacks: Object.freeze({ phaseOne: units['unit-1'].construction === 'complete', phaseTwo: spec.stack }),
    ancillary: Object.freeze({
      administration: id !== '1972-foundations',
      serviceBuildings: id !== '1972-foundations',
      constructionYard: spec.units.some(([stage]) => stage === 'foundation' || stage === 'frame') || spec.nsc === 'assembly',
    }),
  })
}

export const statusLabels: Readonly<Record<OperatingStatus, string>> = {
  'not-built': 'Not built',
  'under-construction': 'Construction',
  'grid-connected': 'First grid connection',
  'in-service': 'In service',
  'temporarily-stopped': 'Temporarily stopped',
  shutdown: 'Shut down',
  destroyed: 'Destroyed',
}

export function visibleLandmarkIds(state: SiteState): readonly string[] {
  return [
    ...unitIds.filter((id) => state.units[id].exists),
    ...(state.shelter.exists ? ['shelter'] : []),
    ...(state.nsc.exists ? ['nsc'] : []),
    ...(unitIds.some((id) => state.turbineHalls[id] !== 'absent') ? ['turbine-halls'] : []),
    ...(state.stacks.phaseTwo !== 'absent' ? ['ventilation-stack'] : []),
    ...(state.ancillary.administration ? ['administration'] : []),
    'cooling-channel',
  ]
}

export function sceneSignature(state: SiteState): string {
  return JSON.stringify({
    units: state.units,
    turbineHalls: state.turbineHalls,
    shelter: state.shelter,
    nsc: state.nsc,
    stacks: state.stacks,
    ancillary: state.ancillary,
  })
}
