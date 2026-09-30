import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'

const paths = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else paths.push(path)
  }
}
walk('dist')
const rows = paths.map((path) => {
  const bytes = readFileSync(path)
  return { file: relative('dist', path), raw: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length }
})
const sum = (key) => rows.reduce((total, row) => total + row[key], 0)
const result = { files: rows, totals: { raw: sum('raw'), gzip: sum('gzip'), brotli: sum('brotli') }, budgetBytes: 15_000_000 }
console.table(rows)
console.log(`All shipped files: ${result.totals.gzip.toLocaleString()} bytes gzip / ${result.totals.brotli.toLocaleString()} bytes Brotli. Conservative total includes the lazy 3D bundle.`)
if (process.env.ASSET_REPORT_PATH) writeFileSync(process.env.ASSET_REPORT_PATH, JSON.stringify(result, null, 2))
if (result.totals.gzip > result.budgetBytes) throw new Error('Initial compressed-transfer budget exceeded.')
