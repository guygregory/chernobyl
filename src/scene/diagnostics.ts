import type { Quality } from '../data/types'

export interface OrbitMeasurement {
  readonly seconds: number
  readonly frames: number
  readonly averageFps: number
  readonly medianFrameMs: number
  readonly p95FrameMs: number
  readonly viewport: readonly [number, number]
  readonly drawingBuffer: readonly [number, number]
  readonly quality: Quality
  readonly renderer: string
  readonly userAgent: string
  readonly calls: number
  readonly triangles: number
}

export interface AtlasDiagnostics {
  ready: boolean
  milestoneId: string
  signature: string
  present: readonly string[]
  quality: Quality
  camera: { position: readonly number[]; target: readonly number[] }
  renderer: string
  info: { calls: number; triangles: number; geometries: number; textures: number; objects: number }
  renderedFrames: number
  measureOrbit: (seconds?: number) => Promise<OrbitMeasurement>
}

declare global {
  interface Window {
    __CHERNOBYL_ATLAS__?: AtlasDiagnostics
  }
}

export const diagnosticsEnabled = () =>
  import.meta.env.DEV || new URLSearchParams(window.location.search).get('diagnostics') === '1'
