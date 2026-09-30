export const milestoneIds = [
  '1972-foundations', '1977-unit-1', '1978-unit-2', '1981-unit-3',
  '1983-unit-4', '1986-before', '1986-accident', '1986-shelter',
  '1991-unit-2-off', '1996-unit-1-off', '2000-last-generation',
  '2013-stack', '2016-nsc-position', '2019-nsc-handover',
  '2025-nsc-damage', '2025-cladding-closed', 'latest-2026',
] as const

export type MilestoneId = typeof milestoneIds[number]
export const unitIds = ['unit-1', 'unit-2', 'unit-3', 'unit-4'] as const
export type UnitId = typeof unitIds[number]
export const landmarkIds = [
  ...unitIds, 'shelter', 'nsc', 'turbine-halls', 'ventilation-stack',
  'administration', 'cooling-channel',
] as const
export type LandmarkId = typeof landmarkIds[number]

export type DatePrecision = 'day' | 'month' | 'year' | 'undated'
export interface SourceDate {
  readonly value: string | null
  readonly precision: DatePrecision
  readonly label: string
}

export interface HistoricalDate {
  readonly value: string
  readonly precision: Exclude<DatePrecision, 'undated'>
  readonly label: string
  readonly end?: string
  readonly qualifier?: 'before'
}

export interface Source {
  readonly title: string
  readonly publisher: string
  readonly url: string
  readonly published: SourceDate
  readonly reviewed: string
  readonly kind: 'primary' | 'secondary' | 'geographic'
  readonly supports: string
  readonly uncertainty: string
}

export type ConstructionStage = 'absent' | 'foundation' | 'frame' | 'complete'
export type OperatingStatus =
  | 'not-built' | 'under-construction' | 'grid-connected'
  | 'in-service' | 'temporarily-stopped' | 'shutdown' | 'destroyed'
export type ReactorVariant = 'first-generation' | 'second-generation' | 'damaged'
export type NscVariant = 'absent' | 'assembly' | 'installed' | 'handed-over' | 'damaged' | 'patched'
export type StackVariant = 'absent' | 'original' | 'replacement'

export interface ReactorState {
  readonly exists: boolean
  readonly construction: ConstructionStage
  readonly variant: ReactorVariant
  readonly operation: OperatingStatus
}

export interface SiteState {
  readonly milestoneId: MilestoneId
  readonly units: Readonly<Record<UnitId, ReactorState>>
  readonly turbineHalls: Readonly<Record<UnitId, ConstructionStage>>
  readonly shelter: { readonly exists: boolean; readonly variant: 'absent' | 'original' | 'stabilized' }
  readonly nsc: { readonly exists: boolean; readonly construction: ConstructionStage; readonly variant: NscVariant }
  readonly stacks: { readonly phaseOne: boolean; readonly phaseTwo: StackVariant }
  readonly ancillary: { readonly administration: boolean; readonly serviceBuildings: boolean; readonly constructionYard: boolean }
}

export type Quality = 'low' | 'medium' | 'high'
export type PanelTab = 'story' | 'landmarks' | 'sources'
export type CameraCommand = { readonly id: number; readonly action: 'reset' | 'focus' | 'zoom-in' | 'zoom-out' | 'north'; readonly landmark?: LandmarkId }
