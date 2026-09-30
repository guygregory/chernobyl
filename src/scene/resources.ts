import {
  BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, DodecahedronGeometry,
  MeshStandardMaterial, RepeatWrapping, SRGBColorSpace,
} from 'three'
import type { Quality } from '../data/types'

export const qualitySettings = {
  low: { dpr: 1, shadows: false, shadowSize: 512, trees: 90, archSegments: 32, detail: 1 },
  medium: { dpr: 1.25, shadows: true, shadowSize: 1024, trees: 210, archSegments: 56, detail: 2 },
  high: { dpr: 1.75, shadows: true, shadowSize: 2048, trees: 330, archSegments: 80, detail: 3 },
} as const

const palette = {
  concrete: '#b5b9b0', concreteWarm: '#c0bdac', concreteDark: '#858f88',
  metal: '#becbd0', metalDark: '#677b7b', roof: '#5e7475', glass: '#64878e',
  glassDim: '#425f66', white: '#dcded5', red: '#a0644e', brick: '#a08f76',
  grass: '#a9b892', grassLight: '#b6c49e', asphalt: '#879284', ballast: '#aaa995',
  timber: '#827968', water: '#779ea0', line: '#d5d7bf', leaf: '#708866',
  leafLight: '#829970', trunk: '#8a8168', rust: '#8c7964', brass: '#b79552',
  soil: '#9b9b80', dark: '#485a54',
} as const

export type MaterialKey = keyof typeof palette
export type GeometryKind = 'box' | 'cylinder' | 'cone' | 'crown'

function grainTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('A 2D canvas is required to generate the original terrain texture.')
  const image = context.createImageData(128, 128)
  let seed = 1729
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const value = 225 + (seed % 29)
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = 255
  }
  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(75, 55)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function createSceneResources(quality: Quality) {
  const texture = grainTexture()
  const materials = Object.fromEntries(Object.entries(palette).map(([key, color]) => [
    key, new MeshStandardMaterial({
      color,
      roughness: key === 'water' ? .39 : key === 'metal' || key === 'glass' ? .53 : .86,
      metalness: key === 'metal' || key === 'metalDark' ? .36 : key === 'water' ? .22 : key === 'glass' ? .16 : .03,
      ...(key === 'grass' || key === 'grassLight' ? { map: texture } : {}),
    }),
  ])) as Record<MaterialKey, MeshStandardMaterial>
  const radial = quality === 'low' ? 8 : 12
  const geometries = {
    box: new BoxGeometry(1, 1, 1),
    cylinder: new CylinderGeometry(.5, .5, 1, radial),
    cone: new ConeGeometry(.5, 1, radial),
    crown: new DodecahedronGeometry(.5, quality === 'high' ? 1 : 0),
  }
  return {
    materials, geometries,
    dispose() {
      Object.values(materials).forEach((material) => material.dispose())
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      texture.dispose()
    },
  }
}

export type SceneResources = ReturnType<typeof createSceneResources>
