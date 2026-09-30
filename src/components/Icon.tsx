import type { CSSProperties } from 'react'

export type IconName = 'previous' | 'next' | 'close' | 'reset' | 'plus' | 'minus' | 'focus' | 'layers' | 'info' | 'arrow' | 'book' | 'check' | 'expand'

const paths: Record<IconName, string> = {
  previous: 'M14 5 7 12l7 7',
  next: 'm10 5 7 7-7 7',
  close: 'm6 6 12 12M18 6 6 18',
  reset: 'M4 10a8 8 0 1 1 1 7M4 4v6h6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  focus: 'M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5M8 12h8M12 8v8',
  layers: 'm12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
  info: 'M12 11v6M12 7v.2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  arrow: 'M6 18 18 6M6 6h12v12',
  book: 'M12 5v15M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z',
  check: 'm5 12 4 4L19 6',
  expand: 'M9 3H3v6M15 3h6v6M21 15v6h-6M3 15v6h6',
}

export function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>
}
