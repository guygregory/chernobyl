import { useRef } from 'react'
import { landmarks, getLandmark } from '../data/landmarks'
import { LATEST_MILESTONE, type Milestone } from '../data/milestones'
import { EDITORIAL_REVIEW, sources, sourceEntries, type SourceId } from '../data/sources'
import { unitIds, type LandmarkId, type PanelTab, type SiteState } from '../data/types'
import { statusLabels, visibleLandmarkIds } from '../state/resolveSiteState'
import { Icon } from './Icon'

const tabs: readonly { id: PanelTab; label: string }[] = [
  { id: 'story', label: 'History' },
  { id: 'landmarks', label: 'Landmarks' },
  { id: 'sources', label: 'Sources' },
]

interface Props {
  milestone: Milestone
  site: SiteState
  selected: LandmarkId | null
  tab: PanelTab
  open: boolean
  onTab: (tab: PanelTab) => void
  onToggle: () => void
  onSelect: (landmark: LandmarkId) => void
  onFocus: (landmark: LandmarkId) => void
  onClear: () => void
}

function SourceLink({ id }: { id: SourceId }) {
  const source = sources[id]
  return <a href={source.url} target="_blank" rel="noreferrer" className="source-link"><span>{source.publisher}<small>{source.title}</small></span><Icon name="arrow" size={15} /></a>
}

export function HistoryPanel({ milestone, site, selected, tab, open, onTab, onToggle, onSelect, onFocus, onClear }: Props) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const available = visibleLandmarkIds(site)
  const landmark = selected ? getLandmark(selected) : null
  const isLatest = milestone.id === LATEST_MILESTONE
  const hiddenByArch = selected && ['unit-4', 'shelter'].includes(selected) && site.nsc.construction === 'complete'

  if (!open) return <button className="panel-opener" onClick={onToggle} aria-expanded="false" aria-controls="history-panel"><Icon name="book" size={18} /><span>Field notes</span><Icon name="previous" size={16} /></button>

  return (
    <aside className="history-panel" id="history-panel" aria-label="History, landmarks and source notes">
      <div className="panel-top"><span className="eyebrow"><span className="small-square" />Field notes</span><button className="icon-button" onClick={onToggle} aria-label="Collapse field notes" aria-expanded="true"><Icon name="close" size={18} /></button></div>
      <div className="panel-tabs" role="tablist" aria-label="Field notes">
        {tabs.map((entry, i) => <button
          key={entry.id}
          id={`tab-${entry.id}`}
          role="tab"
          aria-selected={tab === entry.id}
          aria-controls={`tabpanel-${entry.id}`}
          tabIndex={tab === entry.id ? 0 : -1}
          ref={(element) => { tabRefs.current[i] = element }}
          onClick={() => onTab(entry.id)}
          onKeyDown={(event) => {
            let next = i
            if (event.key === 'ArrowRight') next = (i + 1) % tabs.length
            else if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = tabs.length - 1
            else return
            event.preventDefault()
            const target = tabs[next]
            if (target) { onTab(target.id); tabRefs.current[next]?.focus() }
          }}
        >{entry.label}</button>)}
      </div>
      <div className="panel-content" role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {tab === 'story' && <>
          <div className="event-meta"><span className={`era-chip ${isLatest ? 'verified-chip' : ''}`}>{isLatest ? <><Icon name="check" size={13} />Latest verified</> : milestone.era}</span><span className="event-index">{milestone.year}</span></div>
          <p className="event-date">{milestone.date.label}</p>
          <h1 className="event-title">{milestone.title}</h1>
          <p className="event-summary">{milestone.summary}</p>
          {isLatest && <div className="date-note"><span>State depicted <strong>15 Sep 2026</strong></span><span>Source published <strong>16 Sep 2026</strong></span><span>Editorial review <strong>30 Sep 2026</strong></span><p>Not live. Full restoration is not confirmed.</p></div>}
          {landmark && <section className="selected-landmark" aria-label="Selected landmark">
            <div className="selected-heading"><span className="eyebrow">Selected / {landmark.number}</span><button className="text-icon-button" onClick={onClear} aria-label="Clear selected landmark"><Icon name="close" size={14} /></button></div>
            <h2>{landmark.name}</h2>
            <p>{landmark.description}</p>
            {!available.includes(landmark.id) && <p className="presence-note">Not present at this milestone. Select a later date to see this landmark.</p>}
            {hiddenByArch && <p className="presence-note">Enclosed by the NSC. The exterior view keeps both protective structures intact.</p>}
            <button className="focus-button" onClick={() => onFocus(landmark.id)} disabled={!available.includes(landmark.id)}><Icon name="focus" size={16} />Focus this location</button>
            <details><summary>Landmark and reconstruction notes</summary><p>{landmark.detail}</p><p className="fine-print">{landmark.confidence}</p></details>
          </section>}
          <section className="reactor-status" aria-labelledby="reactor-status-heading">
            <h2 id="reactor-status-heading" className="section-label">Reactor service record</h2>
            <div className="reactor-grid">
              {unitIds.map((id, i) => <button key={id} className={`reactor-pill ${selected === id ? 'selected' : ''}`} data-unit={id} data-status={site.units[id].operation} onClick={() => onSelect(id)}>
                <span><span className={`status-dot status-${site.units[id].operation}`} />Unit {i + 1}</span>
                <small>{statusLabels[site.units[id].operation]}</small>
              </button>)}
            </div>
            <p className="fine-print">Historical service status, not instantaneous output.</p>
          </section>
          <section className="story-prose" aria-label="Historical context">{milestone.paragraphs.map((text) => <p key={text}>{text}</p>)}</section>
          <section className="scene-changes"><h2 className="section-label">In this scene</h2><ul>{milestone.changes.map((change) => <li key={change}>{change}</li>)}</ul></section>
          <details className="confidence-note"><summary>Evidence &amp; reconstruction limits</summary><p className="confidence-label">{milestone.confidence}</p><p>{milestone.uncertainty}</p><p>Exterior reconstruction only. Ancillary buildings, roads, rail, water edges and vegetation are generalized context, not date-specific as-built surveys.</p></details>
          <section className="event-sources"><h2 className="section-label">Sources for this moment</h2>{milestone.sourceIds.map((id) => <SourceLink key={id} id={id} />)}</section>
        </>}
        {tab === 'landmarks' && <>
          <span className="eyebrow">Read the landscape</span><h2 className="panel-section-title">Ten points of reference.</h2><p className="panel-intro">Select a landmark to highlight its location. Focus is always an explicit action.</p>
          <div className="landmark-list">{landmarks.map((entry) => <button key={entry.id} onClick={() => onSelect(entry.id)} className={selected === entry.id ? 'selected' : ''} aria-pressed={selected === entry.id}>
            <span className="landmark-number">{entry.number}</span><span className="landmark-list-copy"><strong>{entry.name}</strong><small>{available.includes(entry.id) ? entry.category : 'Not present at this date'}</small></span><Icon name="next" size={15} />
          </button>)}</div>
          {landmark && <section className="landmark-reading">
            <p className="eyebrow">{landmark.category}</p><h3>{landmark.name}</h3><p>{landmark.description}</p><p>{landmark.detail}</p>
            <p className="fine-print">{landmark.confidence}</p>
            <button className="focus-button" disabled={!available.includes(landmark.id)} onClick={() => onFocus(landmark.id)}><Icon name="focus" size={16} />Focus this location</button>
            {landmark.sourceIds.map((id) => <SourceLink key={id} id={id} />)}
          </section>}
          <p className="fine-print campus-scope">Campus and immediate surrounds only. Pripyat, the wider zone, Units 5/6 and the full cooling pond are outside this map.</p>
        </>}
        {tab === 'sources' && <>
          <span className="eyebrow">An editorial reconstruction</span><h2 className="panel-section-title">Evidence, not a live feed.</h2><p className="panel-intro">Dates below describe publication, not necessarily the state depicted. All records were reviewed on 30 September 2026.</p>
          <div className="source-date-key"><span><strong>Depicted</strong>15 Sep 2026</span><span><strong>Reviewed</strong>30 Sep 2026</span></div>
          {sourceEntries.map(([id, source]) => <article className="source-record" key={id}>
            <span className={`source-kind kind-${source.kind}`}>{source.kind === 'primary' ? 'Primary source' : source.kind === 'secondary' ? 'Secondary record' : 'Geographic reference'}</span>
            <SourceLink id={id} />
            <p className="source-date">Published: {source.published.label}<br />Reviewed: {source.reviewed}</p>
            <p>{source.supports}</p><details><summary>Editorial uncertainty</summary><p>{source.uncertainty}</p></details>
          </article>)}
          <div className="source-maintenance"><p>Original geometry; no redistributed photographs, satellite imagery, models or map tiles.</p><p>Geographic anchors: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors / ODbL</a>.</p><p>Edition {EDITORIAL_REVIEW}. See the repository README for editorial updates and asset attribution.</p></div>
        </>}
      </div>
      <div className="panel-footer"><span className="status-dot status-shutdown" /><span>Source-reviewed history. Approximate geometry.</span></div>
    </aside>
  )
}
