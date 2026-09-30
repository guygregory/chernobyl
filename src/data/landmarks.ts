import type { SourceId } from './sources'
import { landmarkIds, type LandmarkId } from './types'

export const SITE_ORIGIN = { latitude: 51.3893, longitude: 30.0992 } as const
export const SITE_BOUNDS = { minX: -430, maxX: 900, minZ: -410, maxZ: 460 } as const

export function geographicToLocal(latitude: number, longitude: number): readonly [number, number, number] {
  const east = (longitude - SITE_ORIGIN.longitude) * 111_320 * Math.cos(SITE_ORIGIN.latitude * Math.PI / 180)
  const north = (latitude - SITE_ORIGIN.latitude) * 111_320
  return [east, 0, -north]
}

export interface Landmark {
  readonly id: LandmarkId
  readonly number: string
  readonly name: string
  readonly shortName: string
  readonly category: string
  readonly position: readonly [number, number, number]
  readonly footprint: readonly [number, number]
  readonly height: number
  readonly description: string
  readonly detail: string
  readonly sourceIds: readonly SourceId[]
  readonly confidence: string
}

export const landmarks: readonly Landmark[] = [
  {
    id: 'unit-1', number: '01', name: 'Reactor Unit 1', shortName: 'Unit 1',
    category: 'First-generation reactor',
    position: geographicToLocal(51.3893, 30.1066), footprint: [82, 78], height: 56,
    description: 'The easternmost of the four reactor blocks, and the first to supply electricity in 1977.',
    detail: 'A first-generation RBMK-1000 exterior. Its lower, layered industrial form differs from Units 3 and 4. Shutdown in 1996 did not remove the building.',
    sourceIds: ['construction', 'reactorRecords', 'shutdown', 'geography'],
    confidence: 'Approximate anchor from public geographic references; original facade and roof geometry.',
  },
  {
    id: 'unit-2', number: '02', name: 'Reactor Unit 2', shortName: 'Unit 2',
    category: 'First-generation reactor',
    position: geographicToLocal(51.3894, 30.1047), footprint: [82, 78], height: 56,
    description: 'The second eastern reactor, first connected in 1978 and out of generation after the 1991 turbine fire.',
    detail: 'Its building and turbine-hall section remain in the post-generation campus. Cessation of generation in 1991 is distinct from the 1999 formal early-closure decision.',
    sourceIds: ['reactorRecords', 'shutdown', 'geography'],
    confidence: 'Approximate position and envelope; service chronology is sourced.',
  },
  {
    id: 'unit-3', number: '03', name: 'Reactor Unit 3', shortName: 'Unit 3',
    category: 'Second-generation reactor',
    position: geographicToLocal(51.3896139, 30.1007461), footprint: [76, 74], height: 70,
    description: 'The last unit to generate at Chornobyl, finally shut down on 15 December 2000.',
    detail: 'Unit 3 adjoins the Unit 4 complex. It remained stopped after the 1986 accident until December 1987. The model retains it beside, not inside, the NSC arch.',
    sourceIds: ['reactorRecords', 'shutdown', 'geography'],
    confidence: 'Public OSM way 326145079 anchors the generalized exterior; no interiors are modeled.',
  },
  {
    id: 'unit-4', number: '04', name: 'Reactor Unit 4', shortName: 'Unit 4',
    category: 'Destroyed reactor',
    position: geographicToLocal(51.389499, 30.0993627), footprint: [76, 74], height: 70,
    description: 'The reactor destroyed on 26 April 1986, now enclosed by two independent protective structures.',
    detail: 'The damaged reactor remains under the original Shelter, itself inside the New Safe Confinement. Selecting it does not reveal fictional interiors or remove either enclosure.',
    sourceIds: ['accident', 'nsc', 'geography'],
    confidence: 'OSM way 500551950 provides an approximate anchor. Damage is schematic, not precise rubble.',
  },
  {
    id: 'shelter', number: '05', name: 'The original Shelter', shortName: 'Shelter',
    category: 'Protective enclosure / 1986',
    position: geographicToLocal(51.3896171, 30.099337), footprint: [112, 92], height: 67,
    description: 'The emergency concrete-and-steel enclosure accepted in November 1986, often called the sarcophagus.',
    detail: 'The Shelter was stabilized in 2004-2008 and remains a separate object beneath the NSC. Its stepped exterior and steel cover are generalized from public references. It is intentionally not cut away.',
    sourceIds: ['accident', 'shelter', 'geography'],
    confidence: 'OSM way 500551951 anchors the original model; supporting details are approximate.',
  },
  {
    id: 'nsc', number: '06', name: 'New Safe Confinement', shortName: 'New Safe Confinement',
    category: 'Protective arch / 2016',
    position: geographicToLocal(51.3892349, 30.09878), footprint: [162, 257], height: 108,
    description: 'The vast steel arch placed over the Shelter in 2016 and handed over in 2019.',
    detail: 'Published overall dimensions: 257 m span, 108 m height and 162 m length. The 2025 breach and subsequent patch are schematic indicators. Outer-cladding closure does not establish restored confinement capability.',
    sourceIds: ['nsc', 'handover', 'damageAssessment', 'latest', 'geography'],
    confidence: 'Nominal overall dimensions are sourced. OSM way 456732992 anchors placement; cladding and repair detail are original approximations.',
  },
  {
    id: 'turbine-halls', number: '07', name: 'The turbine halls', shortName: 'Turbine halls',
    category: 'Generation infrastructure',
    position: [270, 0, 68], footprint: [665, 54], height: 28,
    description: 'Long, low industrial halls run alongside the reactor blocks and housed the generating equipment.',
    detail: 'Each reactor has a separately resolved hall section. The segmented roof, glazed facades, roof lanterns and external bays are original architectural details. Shutdown leaves the halls standing.',
    sourceIds: ['construction', 'shutdown', 'geography'],
    confidence: 'Generalized continuous silhouette and relative scale, not an as-built measured footprint.',
  },
  {
    id: 'ventilation-stack', number: '08', name: 'Units 3/4 ventilation stack', shortName: 'Ventilation stack',
    category: 'Changing industrial silhouette',
    position: [65, 0, -12], footprint: [16, 16], height: 150,
    description: 'The original tall stack was dismantled in 2013 to clear the NSC path.',
    detail: 'The old 9 m diameter stack rose 75.5 m above its roof support, about 150 m above ground. A smaller 50 m high, 6 m diameter stack replaced it on the eastern side of the plant building.',
    sourceIds: ['stack'],
    confidence: 'Published stack dimensions are used; base structures and replacement location are approximate.',
  },
  {
    id: 'administration', number: '09', name: 'ABK-1 administration', shortName: 'Administration',
    category: 'Campus context',
    position: geographicToLocal(51.3890107, 30.1105773), footprint: [108, 28], height: 20,
    description: 'The administrative building helps locate the eastern edge of the modeled working campus.',
    detail: 'A generalized office facade, service courts and nearby auxiliary sheds provide context. Their historical appearance is not individually reconstructed year by year.',
    sourceIds: ['construction', 'geography'],
    confidence: 'OSM way 225922562 anchors the contextual model. Presence in early operating-era scenes is approximate.',
  },
  {
    id: 'cooling-channel', number: '10', name: 'Cooling-water edge', shortName: 'Cooling-water edge',
    category: 'Immediate landscape',
    position: [485, 0, 292], footprint: [440, 88], height: 4,
    description: 'A small, generalized edge of the cooling-water landscape, not the full cooling pond.',
    detail: 'Water, a bank and a schematic pumping building show the relationship between the industrial campus and its cooling landscape. The town, wider exclusion zone, full pond and Units 5/6 are outside this bounded scene.',
    sourceIds: ['construction', 'geography'],
    confidence: 'Indicative banks and vegetation, not hydrological or survey-grade geometry.',
  },
]

export function isLandmarkId(value: string): value is LandmarkId {
  return landmarkIds.some((id) => id === value)
}

export function getLandmark(id: LandmarkId): Landmark {
  const landmark = landmarks.find((entry) => entry.id === id)
  if (!landmark) throw new Error(`Landmark ${id} has no record.`)
  return landmark
}
