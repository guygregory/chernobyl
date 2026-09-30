import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertSiteManifest, validateHistoricalData } from '../src/data/validate'
import { milestones } from '../src/data/milestones'
import { landmarks } from '../src/data/landmarks'
import { sources } from '../src/data/sources'

const errors = validateHistoricalData()
if (errors.length) throw new Error(`Historical data validation failed:\n${errors.join('\n')}`)
const manifest: unknown = JSON.parse(readFileSync(resolve('public', 'site-manifest.json'), 'utf8'))
assertSiteManifest(manifest)
for (const asset of manifest.assets) {
  const path = resolve('public', ...asset.split('/'))
  if (!statSync(path).isFile()) throw new Error(`Required original asset is missing: ${asset}`)
}
console.log(`Validated ${milestones.length} milestones, ${landmarks.length} landmarks, ${Object.keys(sources).length} source records, immutable states and original asset manifest.`)
