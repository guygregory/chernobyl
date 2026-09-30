import { getLandmark, SITE_BOUNDS } from '../../data/landmarks'
import { unitIds, type ConstructionStage, type LandmarkId, type Quality, type SiteState, type UnitId } from '../../data/types'
import { qualitySettings, type GeometryKind, type MaterialKey } from '../resources'

export type Vec3 = readonly [number, number, number]
export interface ModelPart {
  readonly position: Vec3
  readonly scale: Vec3
  readonly rotation?: Vec3
  readonly quaternion?: readonly [number, number, number, number]
  readonly landmark?: LandmarkId
}
export interface ModelBatch {
  readonly key: string
  readonly geometry: GeometryKind
  readonly material: MaterialKey
  readonly shadow: boolean
  readonly parts: readonly ModelPart[]
}

class ModelBuilder {
  private batches = new Map<string, { geometry: GeometryKind; material: MaterialKey; shadow: boolean; parts: ModelPart[] }>()

  add(material: MaterialKey, position: Vec3, scale: Vec3, landmark?: LandmarkId, geometry: GeometryKind = 'box', rotation?: Vec3, shadow = true, quaternion?: ModelPart['quaternion']) {
    const key = `${geometry}-${material}-${shadow ? 'shadow' : 'flat'}`
    let batch = this.batches.get(key)
    if (!batch) { batch = { geometry, material, shadow, parts: [] }; this.batches.set(key, batch) }
    batch.parts.push({ position, scale, landmark, rotation, quaternion })
  }

  beam(material: MaterialKey, a: Vec3, b: Vec3, width: number, landmark?: LandmarkId) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
    const length = Math.hypot(dx, dy, dz)
    if (length === 0) throw new Error('Original geometry contains a zero-length beam.')
    const w = Math.sqrt(2 * (1 + dy / length))
    const quaternion: ModelPart['quaternion'] = w < .00001 ? [1, 0, 0, 0] : [dz / length / w, 0, -dx / length / w, w / 2]
    this.add(material, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [width, length, width], landmark, 'box', undefined, true, quaternion)
  }

  result(): readonly ModelBatch[] { return [...this.batches].map(([key, value]) => ({ key, ...value })) }
}

function seededRandom(seed: number) {
  let value = seed
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296 }
}

function terrain(builder: ModelBuilder, quality: Quality) {
  const { minX, maxX, minZ, maxZ } = SITE_BOUNDS
  const width = maxX - minX, depth = maxZ - minZ
  const centerX = (minX + maxX) / 2
  builder.add('soil', [(minX + maxX) / 2, -9.2, (minZ + maxZ) / 2], [width, 18, depth], undefined, 'box', undefined, false)
  builder.add('grass', [centerX, -.15, -90], [width, .5, 640], undefined, 'box', undefined, false)
  builder.add('grassLight', [115, -.15, 389], [1090, .5, 142], undefined, 'box', undefined, false)
  builder.add('ballast', [centerX, -.08, 237], [width, .6, 14], 'cooling-channel', 'box', undefined, false)
  builder.add('ballast', [115, -.08, 311], [1090, .6, 14], 'cooling-channel', 'box', undefined, false)
  builder.add('water', [centerX, -.08, 274], [width, .35, 62], 'cooling-channel', 'box', undefined, false)
  builder.add('water', [(666 + maxX) / 2, -.08, 355], [maxX - 666, .35, 210], 'cooling-channel', 'box', undefined, false)
  builder.add('concreteDark', [665, .1, 352], [5, 1.4, 213], 'cooling-channel', 'box', undefined, false)
  builder.add('ballast', [654, .2, 361], [15, .8, 196], 'cooling-channel', 'box', undefined, false)
  for (let i = 0; i < 27; i++) {
    const x = -375 + i * 45
    builder.add('metal', [x, .13, 271 + Math.sin(i * 3) * 13], [12 + i % 7 * 3, .03, .3], 'cooling-channel', 'box', undefined, false)
  }
  builder.add('asphalt', [185, .24, 151], [1100, .35, 15], undefined, 'box', undefined, false)
  builder.add('asphalt', [241, .24, -189], [1120, .35, 12], undefined, 'box', undefined, false)
  builder.add('asphalt', [-157, .24, -17], [12, .35, 329], undefined, 'box', undefined, false)
  builder.add('asphalt', [688, .24, -15], [13, .35, 329], undefined, 'box', undefined, false)
  builder.add('asphalt', [454, .24, 189], [470, .35, 10], undefined, 'box', undefined, false)
  for (let i = 0; i < 68; i++) {
    builder.add('line', [-345 + i * 16, .44, 151], [5.5, .03, .35], undefined, 'box', undefined, false)
  }
  builder.add('ballast', [centerX, .2, -230], [width, .7, 8], undefined, 'box', undefined, false)
  builder.add('metalDark', [centerX, .85, -228.5], [width, .35, .34], undefined, 'box', undefined, false)
  builder.add('metalDark', [centerX, .85, -231.5], [width, .35, .34], undefined, 'box', undefined, false)
  for (let i = 0; i < Math.floor(width / 5.35); i++) builder.add('timber', [minX + 4 + i * 5.35, .51, -230], [.6, .3, 5.2], undefined, 'box', undefined, false)
  const random = seededRandom(1986)
  for (let i = 0; i < 30; i++) {
    const x = minX + random() * width
    const z = -390 + random() * 130
    builder.add(i % 2 ? 'grassLight' : 'grass', [x, .17, z], [17 + random() * 45, .03, 7 + random() * 25], undefined, 'box', undefined, false)
  }
  for (let i = 0; i < qualitySettings[quality].trees; i++) {
    let x: number, z: number
    if (i % 3 === 0) { x = -400 + random() * 175; z = -170 + random() * 380 }
    else if (i % 3 === 1) { x = -410 + random() * 1200; z = -400 + random() * 133 }
    else { x = -405 + random() * 985; z = 346 + random() * 105 }
    const height = 10 + random() * 15
    builder.add('trunk', [x, height * .22, z], [1.1, height * .44, 1.1], undefined, 'cylinder')
    if (i % 4 === 0) {
      builder.add(i % 2 ? 'leaf' : 'leafLight', [x, height * .71, z], [height * .58, height * .72, height * .58], undefined, 'crown')
      if (quality !== 'low') builder.add('leafLight', [x + 2, height * .69, z - 2], [height * .39, height * .49, height * .39], undefined, 'crown')
    } else {
      builder.add(i % 2 ? 'leaf' : 'leafLight', [x, height * .67, z], [height * .5, height * .86, height * .5], undefined, 'cone')
      builder.add('leaf', [x, height * .41, z], [height * .53, height * .5, height * .53], undefined, 'cone')
    }
  }
}

function facade(builder: ModelBuilder, id: LandmarkId, x: number, z: number, width: number, depth: number, base: number, rows: number, detail: number, material: MaterialKey = 'glass') {
  const count = Math.max(4, Math.floor(width / (detail === 1 ? 12 : 7)))
  for (let row = 0; row < rows; row++) {
    const y = base + row * 5.2
    for (let i = 0; i < count; i++) {
      const xx = x - width / 2 + (i + .5) * width / count
      for (const side of [-1, 1]) builder.add(material, [xx, y, z + side * (depth / 2 + .16)], [width / count - 1.25, 2.5, .34], id)
    }
  }
  const sideCount = Math.max(4, Math.floor(depth / 8))
  for (let i = 0; i < sideCount; i++) {
    for (let row = 0; row < rows; row++) {
      for (const side of [-1, 1]) builder.add(material, [x + side * (width / 2 + .16), base + row * 5.2, z - depth / 2 + (i + .5) * depth / sideCount], [.34, 2.5, depth / sideCount - 1.6], id)
    }
  }
}

function reactorBuilding(builder: ModelBuilder, id: UnitId, state: SiteState, detail: number) {
  const record = state.units[id]
  if (!record.exists) return
  const landmark = getLandmark(id)
  const [x, , z] = landmark.position
  const [width, depth] = landmark.footprint
  builder.add('concreteDark', [x, .35, z], [width + 22, .7, depth + 25], id, 'box', undefined, false)
  if (record.construction === 'foundation') {
    builder.add('concreteWarm', [x, 1.1, z], [width, 1.4, depth], id)
    for (const side of [-1, 1]) {
      builder.add('concrete', [x + side * (width / 2 - 1.4), 2.4, z], [2.8, 2.3, depth], id)
      builder.add('concrete', [x, 2.4, z + side * (depth / 2 - 1.4)], [width, 2.3, 2.8], id)
    }
    for (let i = 0; i < 8; i++) builder.add('metalDark', [x - width / 2 + 6 + i * 9, 3.1, z], [.3, .3, depth - 5], id)
    return
  }
  if (record.construction === 'frame') {
    builder.add('concrete', [x, 2, z], [width, 3, depth], id)
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
      builder.add('concreteDark', [x - width / 2 + 3 + i * (width - 6) / 4, 18, z - depth / 2 + 3 + j * (depth - 6) / 3], [2.2, 34, 2.2], id)
    }
    for (const y of [12, 23, 34]) {
      for (let i = 0; i < 4; i++) builder.add('concrete', [x, y, z - depth / 2 + 3 + i * (depth - 6) / 3], [width, 2, 2], id)
      for (let i = 0; i < 5; i++) builder.add('concrete', [x - width / 2 + 3 + i * (width - 6) / 4, y, z], [2, 2, depth], id)
    }
    crane(builder, x + width * .65, z - 10, id)
    return
  }
  if (record.variant === 'damaged') {
    builder.add('concreteDark', [x, 18, z], [width, 35, depth], id)
    builder.add('concrete', [x + 29, 33, z], [12, 65, depth], id)
    builder.add('concrete', [x - 7, 32, z - 31], [60, 63, 8], id)
    builder.add('dark', [x - 7, 37, z + 4], [48, 1, 43], id)
    builder.add('concreteDark', [x - 32, 25, z + 17], [11, 48, 37], id)
    facade(builder, id, x, z, width, depth, 9, 2, detail, 'glassDim')
    builder.add('concreteWarm', [x + 19, 58, z - 19], [11, 18, 22], id)
    builder.add('concrete', [x + 24, 67, z - 15], [19, 2, 27], id, 'box', [0, 0, .13])
    return
  }
  const first = record.variant === 'first-generation'
  builder.add('concreteWarm', [x, first ? 15 : 21, z], [width, first ? 29 : 41, depth], id)
  builder.add('concreteDark', [x, 3.1, z], [width + 2, 5, depth + 2], id)
  const towerWidth = first ? 48 : 57
  const towerDepth = first ? 50 : 61
  const topHeight = first ? 26 : 28
  const topY = first ? 42 : 55
  builder.add(first ? 'concrete' : 'white', [x, topY, z - 5], [towerWidth, topHeight, towerDepth], id)
  builder.add('roof', [x, first ? 55.8 : 69.5, z - 5], [towerWidth + 2, 1.7, towerDepth + 2], id)
  facade(builder, id, x, z, width, depth, 11, first ? 3 : 5, detail)
  facade(builder, id, x, z - 5, towerWidth, towerDepth, first ? 35 : 48, 3, detail, 'glassDim')
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const xx = x - width / 2 + i * width / 6
      builder.add('concreteDark', [xx, first ? 16 : 22, z + side * (depth / 2 + .5)], [1.2, first ? 29 : 41, 1.1], id)
    }
    builder.add('white', [x, first ? 29 : 41.2, z + side * (depth / 2 + .5)], [width + 1, .85, 1.3], id)
    builder.add('metalDark', [x, first ? 57 : 71, z - 5 + side * towerDepth / 2], [towerWidth + 3, .45, .5], id)
  }
  for (let i = 0; i < (detail === 1 ? 3 : 6); i++) {
    builder.add('metalDark', [x - 19 + i * 7, first ? 57 : 72, z - 18], [3.3, 2.5, 5], id)
  }
  builder.add('brick', [x - width / 2 - 9, 12, z + 12], [17, 23, 29], id)
  facade(builder, id, x - width / 2 - 9, z + 12, 17, 29, 7, 2, detail)
  builder.add('glassDim', [x + width / 2 + .5, 8, z + 12], [1, 9, 7], id)
  if (detail > 1) {
    builder.add('metalDark', [x + towerWidth / 2 + .6, topY, z - 19], [1, topHeight, .5], id)
    for (let i = 0; i < 12; i++) builder.add('metal', [x + towerWidth / 2 + 1.1, topY - topHeight / 2 + i * 2.1, z - 19], [1.1, .25, 1.8], id)
  }
}

const hallSegments: Record<UnitId, { x: number; width: number }> = {
  'unit-1': { x: 513, width: 151 },
  'unit-2': { x: 367, width: 143 },
  'unit-3': { x: 132, width: 183 },
  'unit-4': { x: -14, width: 112 },
}

function hall(builder: ModelBuilder, id: UnitId, stage: ConstructionStage, detail: number) {
  if (stage === 'absent') return
  const { x, width } = hallSegments[id]
  const z = 70, depth = 53
  const tag: LandmarkId = 'turbine-halls'
  builder.add('concreteDark', [x, .7, z], [width + 5, 1.2, depth + 7], tag)
  if (stage === 'foundation') {
    builder.add('concreteWarm', [x, 2, z], [width, 2.5, depth], tag)
    return
  }
  if (stage === 'frame') {
    for (let i = 0; i < 10; i++) {
      const xx = x - width / 2 + 3 + i * (width - 6) / 9
      for (const side of [-1, 1]) builder.add('concrete', [xx, 13, z + side * 24], [1.8, 25, 1.8], tag)
      builder.add('concreteDark', [xx, 25, z], [1.8, 2, depth], tag)
    }
    return
  }
  builder.add('concrete', [x, 13, z], [width, 25, depth], tag)
  builder.add('concreteDark', [x, 3, z], [width + 1, 4, depth + 1], tag)
  builder.add('roof', [x, 26.5, z - 13.3], [width + 2, 1.1, 27], tag, 'box', [.065, 0, 0])
  builder.add('roof', [x, 26.5, z + 13.3], [width + 2, 1.1, 27], tag, 'box', [-.065, 0, 0])
  builder.add('metalDark', [x, 29.8, z], [width - 12, 3.6, 9], tag)
  facade(builder, tag, x, z, width, depth, 10, 2, detail)
  const bays = Math.floor(width / 12)
  for (let i = 0; i <= bays; i++) {
    const xx = x - width / 2 + i * width / bays
    builder.add('white', [xx, 14, z + depth / 2 + .45], [1.1, 22, .9], tag)
    builder.add('metalDark', [xx, 27, z], [.7, .7, depth + 1], tag)
    if (i < bays) {
      builder.add('glass', [xx + 5.1, 29.6, z + 4.6], [8.8, 2, .25], tag)
      builder.add('metal', [xx + 3, 28.4, z - 16], [2.1, 3, 2.1], tag, 'cylinder')
    }
  }
  for (let i = 0; i < 4; i++) builder.add('glassDim', [x - width / 2 + 20 + i * (width - 40) / 3, 6.4, z + 27], [8.5, 8.5, .8], tag)
}

function shelter(builder: ModelBuilder, state: SiteState, detail: number) {
  if (!state.shelter.exists) return
  const { position: [x, , z] } = getLandmark('shelter')
  const id: LandmarkId = 'shelter'
  builder.add('concreteDark', [x, 24, z], [112, 46, 91], id)
  builder.add('dark', [x, 46, z], [103, 24, 79], id)
  for (let i = 0; i < 4; i++) builder.add('concrete', [x - 54 + i * 13, 16 + i * 6, z + 43 - i * 4], [26, 32 + i * 12, 12], id)
  for (let i = 0; i < 7; i++) {
    builder.add('concreteWarm', [x - 49 + i * 16, 23, z - 47], [8, 44, 12], id)
    builder.add('concreteDark', [x + 58, 22, z - 38 + i * 12], [10, 40, 5], id)
  }
  builder.add('metalDark', [x, 61.2, z - 21], [112, 1.5, 53], id, 'box', [.16, 0, 0])
  builder.add('roof', [x, 62, z + 20], [111, 1.7, 39], id, 'box', [-.12, 0, 0])
  for (let i = 0; i < (detail > 1 ? 23 : 12); i++) {
    const xx = x - 54 + i * 108 / (detail > 1 ? 22 : 11)
    builder.add('rust', [xx, 61.9, z - 21], [.55, .45, 53], id, 'box', [.16, 0, 0])
    builder.add('metalDark', [xx, 62.9, z + 20], [.55, .45, 38], id, 'box', [-.12, 0, 0])
  }
  builder.add('metalDark', [x, 67.8, z - 9], [112, 2.5, 3], id)
  if (state.shelter.variant === 'stabilized') {
    for (const xx of [x - 63, x - 32, x + 2]) {
      builder.add('metal', [xx, 28, z + 53], [3, 55, 3], id)
      builder.beam('metalDark', [xx, 3, z + 55], [xx, 52, z + 42], 2, id)
    }
    builder.add('metal', [x - 30, 54, z + 50], [73, 3, 3], id)
  }
}

function stacks(builder: ModelBuilder, state: SiteState) {
  if (state.stacks.phaseOne) {
    builder.add('concreteDark', [440, 33, -5], [40, 65, 46], 'unit-2')
    for (let i = 0; i < 6; i++) builder.add(i % 2 ? 'white' : 'concrete', [440, 72 + i * 10, -5], [6.5, 10, 6.5], 'unit-2', 'cylinder')
    builder.add('metalDark', [440, 128, -5], [7.4, 1.5, 7.4], 'unit-2', 'cylinder')
  }
  if (state.stacks.phaseTwo === 'original') {
    const id: LandmarkId = 'ventilation-stack'
    builder.add('concreteDark', [65, 36, -12], [27, 72, 35], id)
    builder.add('metalDark', [65, 73, -12], [17, 4, 17], id)
    for (let i = 0; i < 7; i++) {
      builder.add(i % 2 ? 'white' : 'red', [65, 74.5 + 75.5 / 7 * (i + .5), -12], [9, 75.5 / 7, 9], id, 'cylinder')
      builder.add('metalDark', [65, 74.5 + i * 75.5 / 7, -12], [9.5, .4, 9.5], id, 'cylinder')
    }
    builder.add('metalDark', [65, 150, -12], [10.2, .8, 10.2], id, 'cylinder')
    builder.add('metal', [69.7, 112, -12], [.4, 73, .4], id)
  }
  if (state.stacks.phaseTwo === 'replacement') {
    const x = 164, z = -43, id: LandmarkId = 'ventilation-stack'
    for (const xx of [-7, 7]) for (const zz of [-7, 7]) builder.add('metalDark', [x + xx, 38, z + zz], [1.8, 74, 1.8], id)
    for (let i = 0; i < 5; i++) {
      const y = 7 + i * 14
      for (const zz of [-7, 7]) {
        builder.add('metal', [x, y, z + zz], [16, 1, 1], id)
        builder.beam('metalDark', [x - 7, y, z + zz], [x + 7, y + 14, z + zz], .65, id)
      }
    }
    builder.add('metal', [x, 100, z], [6, 50, 6], id, 'cylinder')
    for (let i = 0; i < 5; i++) builder.add('white', [x, 77 + i * 10, z], [6.5, .7, 6.5], id, 'cylinder')
    builder.add('metalDark', [x, 125.5, z], [7, 1, 7], id, 'cylinder')
  }
}

function office(builder: ModelBuilder, x: number, z: number, width: number, depth: number, height: number, id: LandmarkId, detail: number) {
  builder.add('concreteWarm', [x, height / 2 + .5, z], [width, height, depth], id)
  builder.add('concreteDark', [x, 2, z], [width + 1, 3, depth + 1], id)
  builder.add('roof', [x, height + 1.2, z], [width + 3, 1.5, depth + 3], id)
  facade(builder, id, x, z, width, depth, 6, Math.max(2, Math.floor(height / 5) - 1), detail)
  for (let i = 0; i < Math.floor(width / 18); i++) builder.add('metalDark', [x - width / 2 + 10 + i * 18, height + 2.5, z], [5, 2.3, 4], id)
}

function ancillary(builder: ModelBuilder, state: SiteState, detail: number) {
  if (state.ancillary.administration) {
    const { position: [x, , z] } = getLandmark('administration')
    builder.add('concrete', [x, .3, z], [126, .6, 69], 'administration', 'box', undefined, false)
    office(builder, x, z, 108, 28, 20, 'administration', detail)
    builder.add('glassDim', [x + 2, 8, z + 15], [13, 13, 2], 'administration')
    builder.add('concrete', [x + 2, 1.5, z + 24], [22, 2, 14], 'administration')
  }
  if (state.ancillary.serviceBuildings) {
    office(builder, 282, -94, 106, 25, 17, 'unit-2', detail)
    office(builder, 510, -117, 89, 31, 14, 'unit-1', detail)
    office(builder, 332, -146, 81, 28, 11, 'unit-2', detail)
    builder.add('concrete', [249, 14, 61], [91, 26, 64], 'turbine-halls')
    builder.add('roof', [249, 27.5, 61], [94, 1.5, 66], 'turbine-halls')
    facade(builder, 'turbine-halls', 249, 61, 91, 64, 10, 2, detail)
    builder.add('concreteDark', [631, .6, 201], [96, 1.2, 53], 'cooling-channel')
    office(builder, 631, 204, 68, 30, 13, 'cooling-channel', detail)
    for (let i = 0; i < 4; i++) {
      const x = 297 + i * 62
      builder.add('concrete', [x, 1.4, 121], [31, 2.1, 25], 'turbine-halls')
      builder.add('metalDark', [x, 6, 121], [20, 7, 17], 'turbine-halls')
      builder.add('metal', [x, 10.3, 121], [23, 1.4, 19], 'turbine-halls')
      for (const xx of [-7, 7]) for (const zz of [-5, 5]) {
        builder.add('dark', [x + xx, 13, 121 + zz], [1.4, 5.1, 1.4], 'turbine-halls', 'cylinder')
        builder.add('metal', [x + xx, 15.7, 121 + zz], [2.5, .7, 2.5], 'turbine-halls', 'cylinder')
      }
    }
    for (let i = 0; i < 8; i++) {
      const x = 36 + i * 84
      builder.add('metalDark', [x, 11, 161], [.55, 22, .55])
      builder.add('white', [x + 1.8, 22, 161], [4.2, .45, 1.1])
    }
    for (let i = 0; i < 4; i++) {
      const x = 465 + i * 36
      builder.add('concreteDark', [x, 1, -174], [23, 1.5, 16], 'unit-1')
      builder.add('metal', [x, 5.5, -174], [13, 9, 13], 'unit-1', 'cylinder')
      builder.add('metalDark', [x, 10.5, -174], [14, .8, 14], 'unit-1', 'cylinder')
    }
  }
  if (state.ancillary.constructionYard) {
    const yardX = state.nsc.variant === 'assembly' ? -280 : 567
    for (let i = 0; i < 8; i++) {
      builder.add(i % 2 ? 'concrete' : 'timber', [yardX + (i % 4) * 15, 1.8, -144 + Math.floor(i / 4) * 13], [11, 3.5, 8])
    }
    if (state.milestoneId === '1972-foundations') crane(builder, 531, -44, 'unit-1')
  }
}

function crane(builder: ModelBuilder, x: number, z: number, id: LandmarkId) {
  builder.add('concreteDark', [x, 1.2, z], [15, 2.3, 15], id)
  for (const xx of [-2, 2]) for (const zz of [-2, 2]) builder.add('rust', [x + xx, 24, z + zz], [.5, 46, .5], id)
  for (let i = 0; i < 9; i++) {
    const y = 3 + i * 5
    builder.beam('rust', [x - 2, y, z + 2], [x + 2, y + 5, z + 2], .4, id)
    builder.beam('rust', [x + 2, y, z - 2], [x - 2, y + 5, z - 2], .4, id)
  }
  builder.add('rust', [x - 22, 46, z], [72, 2, 3], id)
  builder.add('concreteDark', [x + 17, 46, z], [11, 5, 6], id)
  builder.beam('metalDark', [x, 55, z], [x - 52, 46, z], .35, id)
  builder.add('metalDark', [x - 43, 29, z], [.18, 31, .18], id)
}

function nscDetails(builder: ModelBuilder, state: SiteState) {
  if (!state.nsc.exists) return
  const { position: [cx, , cz] } = getLandmark('nsc')
  const x = state.nsc.variant === 'assembly' ? -277 : cx
  const z = cz
  const id: LandmarkId = 'nsc'
  builder.add('concreteDark', [x, .48, z], [181, .9, 281], id, 'box', undefined, false)
  for (const side of [-1, 1]) {
    builder.add('concrete', [x - 42, 2, z + side * 130], [286, 3.8, 8], id)
    builder.add('metalDark', [x - 42, 4.2, z + side * 130], [287, .7, 1.8], id)
  }
  if (state.nsc.variant === 'assembly') return
  for (const side of [-1, 1]) {
    const xx = x + side * 81.3
    builder.add('glassDim', [xx, 17, z + 1], [1, 15, 95], id)
    builder.add('concrete', [xx, 5, z], [2, 10, 245], id)
    for (let i = 0; i < 15; i++) builder.add('metal', [xx + side * .65, 17, z - 46 + i * 6.6], [.7, 17, .55], id)
    builder.add('metal', [xx + side * .7, 23.8, z], [.7, .7, 99], id)
    builder.add('metalDark', [xx + side * .8, 10.3, z - 56], [1.1, 18, 22], id)
    for (let i = 0; i < 6; i++) builder.add('metal', [xx + side * 1.4, 3.4 + i * 2.4, z - 56], [.6, .24, 22], id)
  }
  builder.add('concreteDark', [x - 58, 6.5, z - 151], [65, 12, 34], id)
  builder.add('roof', [x - 58, 13, z - 151], [68, 1, 36], id)
}

export function buildSiteModel(state: SiteState, quality: Quality): readonly ModelBatch[] {
  const builder = new ModelBuilder()
  const detail = qualitySettings[quality].detail
  terrain(builder, quality)
  for (const id of unitIds) {
    reactorBuilding(builder, id, state, detail)
    hall(builder, id, state.turbineHalls[id], detail)
  }
  shelter(builder, state, detail)
  stacks(builder, state)
  ancillary(builder, state, detail)
  nscDetails(builder, state)
  return builder.result()
}
