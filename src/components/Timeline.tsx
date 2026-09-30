import { useEffect, useRef } from 'react'
import { milestones, type Milestone } from '../data/milestones'
import type { MilestoneId } from '../data/types'
import { adjacentMilestone } from '../state/selection'
import { Icon } from './Icon'

interface Props {
  milestone: Milestone
  onSelect: (id: MilestoneId) => void
}

export function Timeline({ milestone, onSelect }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const trackRef = useRef<HTMLElement>(null)
  const index = milestones.findIndex((entry) => entry.id === milestone.id)
  useEffect(() => {
    const track = trackRef.current
    const active = activeRef.current
    if (!track || !active) return
    const centerActive = () => track.scrollTo({ left: Math.max(0, active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2), behavior: 'instant' })
    centerActive()
    const observer = new ResizeObserver(centerActive)
    observer.observe(track)
    return () => observer.disconnect()
  }, [milestone.id])

  return (
    <footer className="timeline" aria-label="Historical timeline">
      <div className="timeline-heading">
        <div className="timeline-description">
          <span className="eyebrow">Explore the timeline</span>
          <span className="timeline-caption">One site. Seventeen documented moments.</span>
        </div>
        <div className="timeline-navigation">
          <label className="sr-only" htmlFor="milestone-picker">Jump to a milestone</label>
          <select id="milestone-picker" value={milestone.id} onChange={(event) => {
            const entry = milestones.find((item) => item.id === event.target.value)
            if (entry) onSelect(entry.id)
          }}>
            {milestones.map((entry) => <option key={entry.id} value={entry.id}>{entry.date.label} - {entry.shortTitle}</option>)}
          </select>
          <div className="timeline-arrows">
            <button className="icon-button" aria-label="Previous milestone" disabled={index === 0} onClick={() => onSelect(adjacentMilestone(milestone.id, -1))}><Icon name="previous" /></button>
            <span aria-label={`Milestone ${index + 1} of ${milestones.length}`}>{String(index + 1).padStart(2, '0')}<span className="muted"> / {milestones.length}</span></span>
            <button className="icon-button" aria-label="Next milestone" disabled={index === milestones.length - 1} onClick={() => onSelect(adjacentMilestone(milestone.id, 1))}><Icon name="next" /></button>
          </div>
        </div>
      </div>
      <nav ref={trackRef} className="milestone-track" aria-label="Select a historical milestone">
        {milestones.map((entry) => {
          const active = entry.id === milestone.id
          return (
            <button
              key={entry.id}
              ref={active ? activeRef : undefined}
              className={`milestone ${active ? 'is-active' : ''} ${entry.id === '1986-accident' ? 'is-rupture' : ''}`}
              aria-label={`${entry.date.label}: ${entry.shortTitle}`}
              aria-current={active ? 'step' : undefined}
              data-milestone={entry.id}
              onClick={() => onSelect(entry.id)}
            >
              <span className="milestone-node" aria-hidden="true" />
              <span className="milestone-year">{entry.year}</span>
              <span className="milestone-name">{entry.shortTitle}</span>
            </button>
          )
        })}
      </nav>
      <div className="timeline-footnote"><span>Manual milestones, not a continuous reconstruction</span><span>1972 <span aria-hidden="true">&mdash;</span> 2026</span></div>
    </footer>
  )
}
