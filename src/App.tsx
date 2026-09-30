import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getMilestone, LATEST_MILESTONE } from './data/milestones'
import { type CameraCommand, type LandmarkId, type MilestoneId, type PanelTab, type Quality } from './data/types'
import { resolveSiteState } from './state/resolveSiteState'
import { parseSelection, selectionHash, type Selection } from './state/selection'
import { Timeline } from './components/Timeline'
import { HistoryPanel } from './components/HistoryPanel'
import { MapViewport } from './components/MapViewport'
import { HelpDialog } from './components/HelpDialog'
import { Icon } from './components/Icon'

export default function App() {
  const initial = useMemo(() => parseSelection(window.location.hash, window.location.search), [])
  const [selection, setSelection] = useState<Selection>(initial.selection)
  const [linkError, setLinkError] = useState(initial.error)
  const [panelOpen, setPanelOpen] = useState(() => !window.matchMedia('(max-width: 760px)').matches)
  const [tab, setTab] = useState<PanelTab>('story')
  const [quality, setQuality] = useState<Quality>('medium')
  const [labels, setLabels] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const [command, setCommand] = useState<CameraCommand>({ id: 0, action: 'reset' })
  const [announcement, setAnnouncement] = useState('')
  const commandId = useRef(0)
  const milestone = getMilestone(selection.milestone)
  const site = useMemo(() => resolveSiteState(selection.milestone), [selection.milestone])

  const updateSelection = useCallback((next: Selection) => {
    setSelection(next)
    setLinkError(null)
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${selectionHash(next)}`)
  }, [])

  const selectMilestone = (id: MilestoneId) => {
    updateSelection({ ...selection, milestone: id })
    const next = getMilestone(id)
    setAnnouncement(`${next.date.label}. ${next.title}`)
  }
  const selectLandmark = useCallback((id: LandmarkId) => {
    updateSelection({ ...selection, landmark: id })
    setPanelOpen(true)
  }, [selection, updateSelection])
  const moveCamera = (action: CameraCommand['action'], landmark?: LandmarkId) => {
    commandId.current += 1
    setCommand({ id: commandId.current, action, landmark })
  }

  useEffect(() => {
    const readLocation = () => {
      const parsed = parseSelection(window.location.hash, window.location.search)
      setSelection(parsed.selection)
      setLinkError(parsed.error)
      if (parsed.selection.landmark) setPanelOpen(true)
    }
    window.addEventListener('hashchange', readLocation)
    window.addEventListener('popstate', readLocation)
    return () => { window.removeEventListener('hashchange', readLocation); window.removeEventListener('popstate', readLocation) }
  }, [])

  useEffect(() => {
    document.title = `${milestone.year}: ${milestone.shortTitle} | Chernobyl Atlas`
  }, [milestone])

  return <div className="atlas-app">
    <a className="skip-link" href="#milestone-picker" onClick={(event) => {
      event.preventDefault()
      const picker = document.getElementById('milestone-picker')
      picker?.focus({ preventScroll: true })
      picker?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }}>Skip to historical timeline</a>
    <header className="site-header">
      <a href={selectionHash({ milestone: LATEST_MILESTONE, landmark: null })} className="brand" aria-label="Chernobyl Atlas, latest verified state" onClick={(event) => { event.preventDefault(); updateSelection({ milestone: LATEST_MILESTONE, landmark: null }) }}>
        <img src={`${import.meta.env.BASE_URL}assets/atlas-mark.svg`} alt="" width="39" height="39" />
        <span>Chernobyl<span className="brand-subtitle">Historical atlas</span></span>
      </a>
      <div className="header-location"><span className="location-cross" aria-hidden="true">+</span><span>CHORNOBYL NUCLEAR POWER PLANT<small>Ukraine &nbsp; / &nbsp; 51.3893&deg; N, 30.0992&deg; E</small></span></div>
      <div className="header-right"><span className="not-live"><span />Not live</span><span className="header-verification">Latest verified <strong>Sep 2026</strong></span><button className="header-guide" onClick={() => setHelpOpen(true)}><Icon name="info" size={18} /><span>Guide</span></button></div>
    </header>
    <main className={`workspace ${panelOpen ? 'panel-is-open' : ''}`} id="main-content">
      <MapViewport site={site} selected={selection.landmark} labels={labels} quality={quality} command={command} onSelect={selectLandmark} />
      <div className="map-title"><span className="eyebrow">An industrial landscape, re-examined</span><h2>A site through time.</h2><p>Explore the campus. Read the evidence.</p></div>
      {linkError && <div className="link-error" role="alert"><Icon name="info" size={18} /><p>{linkError}</p><button onClick={() => updateSelection({ milestone: LATEST_MILESTONE, landmark: null })}>Reset link</button></div>}
      <div className="map-toolbar" aria-label="Map controls">
        <button className="toolbar-button" onClick={() => moveCamera('reset')} aria-label="Reset campus view" title="Reset campus view"><Icon name="reset" /></button>
        <span className="toolbar-divider" />
        <button className="toolbar-button" onClick={() => moveCamera('zoom-in')} aria-label="Zoom in" title="Zoom in"><Icon name="plus" /></button>
        <button className="toolbar-button" onClick={() => moveCamera('zoom-out')} aria-label="Zoom out" title="Zoom out"><Icon name="minus" /></button>
        <span className="toolbar-divider" />
        <button className="toolbar-button" aria-pressed={labels} onClick={() => setLabels((value) => !value)} aria-label="Show landmark labels" title="Landmark labels"><Icon name="layers" /></button>
        <label className="quality-control"><span className="sr-only">Rendering quality</span><select aria-label="Rendering quality" value={quality} onChange={(event) => {
          const value = event.target.value
          if (value === 'low' || value === 'medium' || value === 'high') setQuality(value)
        }}><option value="low">Low detail</option><option value="medium">Medium detail</option><option value="high">High detail</option></select></label>
      </div>
      <div className="map-orientation"><button onClick={() => moveCamera('north')} title="North-oriented view" aria-label="Orient map north"><svg width="32" height="38" viewBox="0 0 32 38" aria-hidden="true"><text x="16" y="9" textAnchor="middle" fontSize="9" fill="currentColor">N</text><path d="m16 14 7 19-7-4-7 4Z" fill="currentColor" /></svg></button><div className="map-scale"><span /><small>Local metric frame</small></div></div>
      <div className="map-caption"><span className="small-square" /><span>Original exterior reconstruction<small>Approximate campus / not survey-grade</small><small>Geographic reference: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">&copy; OpenStreetMap contributors</a></small></span></div>
      <div className="map-instructions"><span>Drag to orbit</span><span>Scroll to zoom</span><button onClick={() => setHelpOpen(true)}>Keyboard &amp; touch<Icon name="info" size={13} /></button></div>
      <HistoryPanel milestone={milestone} site={site} selected={selection.landmark} tab={tab} open={panelOpen} onTab={setTab} onToggle={() => setPanelOpen((value) => !value)} onSelect={selectLandmark} onFocus={(id) => moveCamera('focus', id)} onClear={() => updateSelection({ ...selection, landmark: null })} />
    </main>
    <Timeline milestone={milestone} onSelect={selectMilestone} />
    <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </div>
}
