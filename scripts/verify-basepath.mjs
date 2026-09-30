import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { chromium } from '@playwright/test'

const base = '/chernobyl/'
const output = resolve('test-results', 'nested-dist')
execFileSync(process.execPath, [join('node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', output, '--logLevel', 'error'], {
  env: { ...process.env, APP_BASE_PATH: base },
  stdio: 'inherit',
})
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
  if (!pathname.startsWith(base)) { response.writeHead(404).end('Outside the tested static base.'); return }
  const relativePath = decodeURIComponent(pathname.slice(base.length)) || 'index.html'
  const file = resolve(output, ...relativePath.split('/'))
  if (!file.startsWith(output + sep)) { response.writeHead(403).end('Outside the test build.'); return }
  if (!existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end('Asset not found.'); return }
  const content = readFileSync(file)
  response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream', 'content-length': content.length, 'cache-control': 'no-store' })
  response.end(content)
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('The temporary static-base server has no TCP address.')
const origin = `http://127.0.0.1:${address.port}`
let browser
try {
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  const requests = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => requests.push(new URL(request.url()).pathname))
  await page.goto(`${origin}${base}?diagnostics=1#milestone=1986-shelter&landmark=shelter`)
  await page.waitForSelector('[data-scene-status="ready"]', { timeout: 30_000 })
  const map = page.locator('[data-testid="map"]')
  assert.equal(await map.getAttribute('data-milestone'), '1986-shelter')
  assert.equal(await map.getAttribute('data-selected-landmark'), 'shelter')
  assert.equal(await page.locator('.link-error').count(), 0)
  await page.locator('#milestone-picker').selectOption('latest-2026')
  assert.equal(await map.getAttribute('data-milestone'), 'latest-2026')
  assert.ok(page.url().startsWith(`${origin}${base}`))
  assert.ok(requests.every((path) => path.startsWith(base)))
  assert.ok(requests.includes(`${base}site-manifest.json`))
  assert.ok(requests.some((path) => /PlantScene-.*\.js$/.test(path)))
  assert.deepEqual(errors, [])
  console.log(`PASS: real production WebGL, manifest, all ${requests.length} requested assets and historical hash navigation work under ${base}; no routing rewrite or external assets.`)
} finally {
  await browser?.close()
  await new Promise((done, reject) => server.close((error) => error ? reject(error) : done()))
}
