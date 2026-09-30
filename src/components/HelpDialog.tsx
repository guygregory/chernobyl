import { useEffect, useRef } from 'react'
import { Icon } from './Icon'

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className="help-dialog" onClose={onClose} onCancel={onClose} aria-labelledby="help-title">
    <div className="dialog-heading"><span className="eyebrow">Exploring the atlas</span><button className="icon-button" aria-label="Close exploration guide" onClick={onClose}><Icon name="close" /></button></div>
    <h2 id="help-title">Take your time.</h2>
    <p>There is no playback. Each date is a discrete, sourced historical snapshot; choosing one keeps your camera where it is.</p>
    <dl className="control-guide"><div><dt>Orbit</dt><dd>Drag with one finger or the left mouse button</dd></div><div><dt>Pan</dt><dd>Two fingers or right mouse button</dd></div><div><dt>Zoom</dt><dd>Pinch, scroll, or use the + / - controls</dd></div><div><dt>Keyboard map</dt><dd>Tab to the canvas. Arrow keys pan; Shift + arrows orbit; + / - zoom; Home resets.</dd></div><div><dt>Explore a landmark</dt><dd>Select a building, map label or landmark in Field notes. Use Focus to move the camera.</dd></div></dl>
    <p className="guide-limit">An original, historically informed exterior reconstruction. Not a survey, a safety model or a real-time site view. No interiors, radiation overlays or access-route information.</p>
    <button className="focus-button" onClick={onClose}>Return to the map<Icon name="next" size={16} /></button>
  </dialog>
}
