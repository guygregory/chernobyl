import type { SourceId } from './sources'
import { milestoneIds, type HistoricalDate, type MilestoneId } from './types'

export interface Milestone {
  readonly id: MilestoneId
  readonly date: HistoricalDate
  readonly year: string
  readonly shortTitle: string
  readonly title: string
  readonly era: 'Construction' | 'Generation' | 'Accident & response' | 'Decommissioning' | 'Confinement' | 'Restoration'
  readonly summary: string
  readonly paragraphs: readonly string[]
  readonly changes: readonly string[]
  readonly sourceIds: readonly SourceId[]
  readonly confidence: 'Documented event / approximate geometry' | 'Documented event / schematic damage'
  readonly uncertainty: string
}

const approximate = 'Documented event / approximate geometry'
const schematic = 'Documented event / schematic damage'

export const milestones: readonly Milestone[] = [
  {
    id: '1972-foundations',
    date: { value: '1972-08-15', precision: 'day', label: '15 August 1972' },
    year: '1972', shortTitle: 'Foundations', title: 'The main building begins.',
    era: 'Construction',
    summary: 'First concrete is placed in the main-building foundation. The story of the site had already begun.',
    paragraphs: ['Planning and site preparation preceded 1972. This atlas begins at the documented main-building foundation milestone, not at the beginning of the entire Chornobyl project.', 'The scene shows the first reactor footprint, construction materials and a work yard. The arrangement and stage of this early work are schematic; this is not a reconstruction of a particular construction-day photograph.'],
    changes: ['Unit 1 foundation footprint', 'Later reactor blocks not yet present', 'Generalized construction landscape'],
    sourceIds: ['construction', 'reactorRecords'], confidence: approximate,
    uncertainty: 'Construction stages are discrete editorial interpretations, not measured percentages. Terrain and routes are contextual.',
  },
  {
    id: '1977-unit-1',
    date: { value: '1977-09-26', precision: 'day', label: '26 September 1977' },
    year: '1977', shortTitle: 'Unit 1', title: 'First electricity from Unit 1.',
    era: 'Generation',
    summary: 'Unit 1 supplies the grid for the first time, opening the generating life of the plant.',
    paragraphs: ['The first grid connection is the milestone shown here. It is distinct from commercial operation, recorded on 27 May 1978.', 'The first-generation reactor and its turbine-hall section now stand on the eastern part of the campus. Later units remain at generalized construction stages.'],
    changes: ['Unit 1 and its turbine hall complete', 'Unit 2 under construction', 'Unit 3 construction footprint'],
    sourceIds: ['construction', 'reactorRecords'], confidence: approximate,
    uncertainty: 'Grid connection does not imply full-time commercial output. Intermediate construction silhouettes are approximate.',
  },
  {
    id: '1978-unit-2',
    date: { value: '1978-12-21', precision: 'day', label: '21 December 1978' },
    year: '1978', shortTitle: 'Unit 2', title: 'The first pair is connected.',
    era: 'Generation',
    summary: 'Unit 2 first supplies the grid. The eastern, first-generation pair is now complete.',
    paragraphs: ['Unit 2 first connected to the grid in December 1978; its commercial-operation date is 28 May 1979. Unit 1 had already entered commercial operation.', 'The original two-unit group has a different exterior form from the second-generation pair later built to the west.'],
    changes: ['Units 1 and 2 built', 'Eastern turbine-hall sections present', 'Units 3 and 4 not yet operating'],
    sourceIds: ['reactorRecords', 'construction'], confidence: approximate,
    uncertainty: 'The date is read from the accessible GEM transcription of IAEA PRIS; the legacy primary record redirects. Facades are original approximations.',
  },
  {
    id: '1981-unit-3',
    date: { value: '1981-12-03', precision: 'day', label: '3 December 1981' },
    year: '1981', shortTitle: 'Unit 3', title: 'A new generation of reactor blocks.',
    era: 'Generation',
    summary: 'Unit 3 first connects to the grid, extending the campus westward.',
    paragraphs: ['Unit 3 belongs to the second-generation RBMK group. Its first grid connection in December 1981 precedes commercial operation on 8 June 1982.', 'Its taller block, associated turbine hall and shared ventilation stack change the silhouette of the plant. Unit 4 is shown as a schematic construction frame.'],
    changes: ['Unit 3 complete', 'Original Units 3/4 stack present', 'Unit 4 under construction'],
    sourceIds: ['reactorRecords', 'stack'], confidence: approximate,
    uncertainty: 'The Unit 4 construction frame is illustrative, not a verified daily progress record.',
  },
  {
    id: '1983-unit-4',
    date: { value: '1983-12-22', precision: 'day', label: '22 December 1983' },
    year: '1983', shortTitle: 'Unit 4', title: 'Four units on the campus.',
    era: 'Generation',
    summary: 'Unit 4 supplies the grid for the first time. All four main reactor buildings are present.',
    paragraphs: ['Unit 4 first connects to the grid on 22 December 1983. Commercial operation is recorded separately on 26 March 1984; the official plant history describes reaching 1,000 MW on 28 March.', 'This milestone completes the four-unit campus represented in the atlas. The unfinished Units 5 and 6 are outside the selected map extent and are not modeled.'],
    changes: ['Unit 4 exterior complete', 'All four turbine-hall sections present', 'No Shelter or New Safe Confinement'],
    sourceIds: ['reactorRecords', 'construction'], confidence: approximate,
    uncertainty: 'Grid connection, commercial operation and full rated power are separate events. No continuous yearly construction sequence is implied.',
  },
  {
    id: '1986-before',
    date: { value: '1986-04-26', precision: 'day', label: 'Before 26 April 1986', qualifier: 'before' },
    year: '1986', shortTitle: 'Before', title: 'The four-unit generating plant.',
    era: 'Generation',
    summary: 'The campus immediately before the accident, with the intact Unit 4 exterior.',
    paragraphs: ['Four units had entered service. The tall red-and-white ventilation stack and the long turbine halls define the familiar pre-accident silhouette.', 'The service indicators describe the units in this historical era, not their instantaneous power during the test or maintenance schedule. No reactor interiors or accident simulation are included.'],
    changes: ['Intact Unit 4', 'Original shared ventilation stack', 'Four units in the generating era'],
    sourceIds: ['accident', 'reactorRecords', 'shutdown'], confidence: approximate,
    uncertainty: 'An era-level exterior, not a minute-specific operating diagram. Later protective structures are absent.',
  },
  {
    id: '1986-accident',
    date: { value: '1986-04-26', end: '1986-04-27', precision: 'day', label: '26-27 April 1986' },
    year: '1986', shortTitle: 'Accident', title: 'An irreversible rupture.',
    era: 'Accident & response',
    summary: 'Unit 4 is destroyed on 26 April. The other units enter the immediate shutdown sequence.',
    paragraphs: ['The accident destroyed Unit 4 during a test in the early hours of 26 April. Unit 3 was stopped shortly afterward; Units 1 and 2 were stopped on 27 April. This snapshot covers that immediate two-day aftermath.', 'The model uses a broken upper envelope to communicate the loss of the reactor building. It deliberately omits precise rubble, exposed reactor internals, fire, smoke and sensational effects.'],
    changes: ['Unit 4 damaged exterior', 'Other units temporarily stopped over 26-27 April', 'Shelter not yet built'],
    sourceIds: ['accident', 'shutdown'], confidence: schematic,
    uncertainty: 'Damage is a historically informed symbol, not a forensic reconstruction. The two-day state is explicitly aggregated.',
  },
  {
    id: '1986-shelter',
    date: { value: '1986-11-30', precision: 'day', label: '30 November 1986' },
    year: '1986', shortTitle: 'Shelter', title: 'A first protective envelope.',
    era: 'Accident & response',
    summary: 'The original Shelter is accepted after 206 days of construction.',
    paragraphs: ['The Shelter combined new walls and a steel roof with surviving parts of the destroyed Unit 4. It was an urgent protective structure, not a permanent solution to the damaged reactor.', 'Units 1 and 2 had restarted in October and November 1986. Unit 3 was still stopped; its post-accident restart would come on 4 December 1987.'],
    changes: ['Original Shelter independently surrounds Unit 4', 'Units 1 and 2 back in service', 'Unit 3 remains temporarily stopped'],
    sourceIds: ['accident', 'shutdown'], confidence: approximate,
    uncertainty: 'The stepped walls and steel roof capture the exterior form but not every historic supporting member.',
  },
  {
    id: '1991-unit-2-off',
    date: { value: '1991', precision: 'year', label: '1991' },
    year: '1991', shortTitle: 'Unit 2 stops', title: 'Unit 2 ends generation.',
    era: 'Decommissioning',
    summary: 'Following a turbine-hall fire, Unit 2 does not return to generation. Its buildings remain.',
    paragraphs: ['Unit 2 ceased generation after the October 1991 turbine fire. The formal decision for its early closure came in March 1999; these are not the same event.', 'Units 1 and 3 continued to operate. The campus is not demolished when a reactor shuts down, so the geometry remains while the service record changes.'],
    changes: ['Unit 2 status changes, building retained', 'Units 1 and 3 in service', 'Original Shelter remains'],
    sourceIds: ['reactorRecords', 'shutdown'], confidence: approximate,
    uncertainty: 'Year precision is deliberately used for this milestone. No detailed reconstruction of the turbine fire is presented.',
  },
  {
    id: '1996-unit-1-off',
    date: { value: '1996-11-30', precision: 'day', label: '30 November 1996' },
    year: '1996', shortTitle: 'Unit 1 stops', title: 'Only Unit 3 still generates.',
    era: 'Decommissioning',
    summary: 'Unit 1 is shut down. Generation continues only at Unit 3.',
    paragraphs: ['The closure of Unit 1 is part of the staged end of generation at Chornobyl. Its reactor building, turbine-hall section and associated industrial fabric remain on the site.', 'The original Shelter continues to cover the destroyed Unit 4. It is not replaced or removed by the shutdown of another unit.'],
    changes: ['Unit 1 permanently shut down', 'Unit 3 still in service', 'No demolition implied'],
    sourceIds: ['shutdown', 'reactorRecords'], confidence: approximate,
    uncertainty: 'Service status is documented; minor facade and yard changes between operating years are not reconstructed.',
  },
  {
    id: '2000-last-generation',
    date: { value: '2000-12-15', precision: 'day', label: '15 December 2000' },
    year: '2000', shortTitle: 'Last power', title: 'The end of electricity generation.',
    era: 'Decommissioning',
    summary: 'Unit 3 is permanently shut down. The site enters a different, continuing working life.',
    paragraphs: ['At 13:17 on 15 December 2000, Unit 3 was shut down for the last time. No Chornobyl reactor would generate electricity afterward.', 'Shutdown is not abandonment. Decommissioning, waste management and the work to transform the Shelter continue, with the main industrial buildings still standing.'],
    changes: ['Units 1-3 all shut down', 'All reactor and turbine-hall buildings retained', 'Original Shelter remains separate'],
    sourceIds: ['shutdown'], confidence: approximate,
    uncertainty: 'The atlas models major exterior milestones, not the detailed equipment-removal programme.',
  },
  {
    id: '2013-stack',
    date: { value: '2013-12', precision: 'month', label: 'December 2013' },
    year: '2013', shortTitle: 'New stack', title: 'Making room for the arch.',
    era: 'Confinement',
    summary: 'The old Units 3/4 ventilation stack has been removed and a smaller replacement is in service.',
    paragraphs: ['Removal of the old stack clears the path for the New Safe Confinement. Its final section was removed in November; completion was formally confirmed in December 2013.', 'The smaller replacement had been commissioned in October. To the west, a generalized framework indicates the NSC construction programme. The stabilized original Shelter remains an independent structure.'],
    changes: ['Old stack replaced with smaller eastern stack', 'Shelter stabilization represented', 'NSC assembly yard to the west'],
    sourceIds: ['stack', 'shelter', 'handover'], confidence: approximate,
    uncertainty: 'The arch framework is a construction symbol, not the precise 2013 assembly configuration.',
  },
  {
    id: '2016-nsc-position',
    date: { value: '2016-11-29', precision: 'day', label: '29 November 2016' },
    year: '2016', shortTitle: 'Arch in place', title: 'A new envelope over the old Shelter.',
    era: 'Confinement',
    summary: 'The New Safe Confinement reaches its design position over Unit 4 and the original Shelter.',
    paragraphs: ['The huge arch was assembled beside the damaged reactor and moved into place. Its published dimensions are a 257 m north-south span, 108 m height and 162 m east-west length.', 'The original Shelter remains underneath it. Installation is not the 2019 handover or the later operating permissions, and this app does not animate an undocumented construction transition.'],
    changes: ['NSC installed over Unit 4', 'Original Shelter retained underneath', 'Replacement ventilation stack remains'],
    sourceIds: ['nsc', 'shelter'], confidence: approximate,
    uncertainty: 'Published overall dimensions are used; panel divisions and enclosing details are simplified. No interior is shown.',
  },
  {
    id: '2019-nsc-handover',
    date: { value: '2019-07-10', precision: 'day', label: '10 July 2019' },
    year: '2019', shortTitle: 'Handover', title: 'The arch is handed over.',
    era: 'Confinement',
    summary: 'The completed New Safe Confinement project is handed over to the Ukrainian authorities.',
    paragraphs: ['The handover marked a distinct administrative and project milestone. The arch had already been installed in 2016; it does not appear a second time in the scene.', 'The NSC provides a protected working envelope for future work on the Shelter. Trial operation and additional permissions followed in 2020.'],
    changes: ['Same installed arch, new project status', 'Shelter still inside the NSC', 'All reactor units remain shut down or destroyed'],
    sourceIds: ['handover', 'nsc'], confidence: approximate,
    uncertainty: 'Handover is documented without inventing new exterior geometry for a metadata-only event.',
  },
  {
    id: '2025-nsc-damage',
    date: { value: '2025-02-14', precision: 'day', label: '14 February 2025' },
    year: '2025', shortTitle: 'NSC damage', title: 'The confinement is damaged.',
    era: 'Restoration',
    summary: 'A drone strike damages the NSC cladding; the resulting fire affects its sealing membrane.',
    paragraphs: ['Official reporting documents loss of some key safety functions, including confinement capability. Later assessment found no irreversible damage to the supporting structures or monitoring systems.', 'A small break in the modeled cladding is an indicative exterior marker only. It must not be interpreted as measured damage geometry or as a simulation of the strike.'],
    changes: ['Schematic cladding breach', 'Arch and supporting structure remain', 'No new reactor generation'],
    sourceIds: ['damageAssessment'], confidence: schematic,
    uncertainty: 'Breach size and position are not claimed as accurate. The IAEA assessment is reported in the December 2025 primary source.',
  },
  {
    id: '2025-cladding-closed',
    date: { value: '2025-10', precision: 'month', label: 'October 2025' },
    year: '2025', shortTitle: 'Opening closed', title: 'A closed opening is not full restoration.',
    era: 'Restoration',
    summary: 'Work closes the opening in the outer cladding. The NSC still needs functional restoration.',
    paragraphs: ['The plant reported in December that the outer-cladding opening had been eliminated in October. Restoring sealing membranes and full tightness remained a separate, complex task.', 'The scene replaces the schematic breach with an indicative patch. This visual closure does not mean confinement capability has been fully restored.'],
    changes: ['Indicative exterior patch, not an open breach', 'Underlying Shelter retained', 'Functional restoration remains incomplete'],
    sourceIds: ['damageAssessment'], confidence: schematic,
    uncertainty: 'Only month precision is supported for the closure. The patch is artist-authored; its construction and dimensions are not verified.',
  },
  {
    id: 'latest-2026',
    date: { value: '2026-09-15', precision: 'day', label: '15 September 2026' },
    year: '2026', shortTitle: 'Latest verified', title: 'Restoration is still unfinished.',
    era: 'Restoration',
    summary: 'The latest verified account describes continuing international work to restore the New Safe Confinement.',
    paragraphs: ['At the 15 September 2026 IAEA General Conference meeting, NSC restoration remained a priority. The plant reported ongoing technical, expert and financial coordination; it did not announce completed restoration.', 'The model retains the previously documented closed outer-cladding opening. No unverified September 2026 buildings, new infrastructure or completed repairs are added. This dated reconstruction is not live telemetry.'],
    changes: ['Documented outer opening remains closed', 'NSC functional restoration not claimed complete', 'No speculative new infrastructure'],
    sourceIds: ['latest', 'damageAssessment', 'restorationPlan'], confidence: schematic,
    uncertainty: 'State depicted: 15 September 2026. Latest source published: 16 September. Editorially reviewed: 30 September. All other campus geometry is approximate.',
  },
]

export const LATEST_MILESTONE: MilestoneId = 'latest-2026'
export function isMilestoneId(value: string): value is MilestoneId {
  return milestoneIds.some((id) => id === value)
}

export function getMilestone(id: MilestoneId): Milestone {
  const milestone = milestones.find((entry) => entry.id === id)
  if (!milestone) throw new Error(`Milestone ${id} has no historical record.`)
  return milestone
}
