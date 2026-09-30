import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'

const mode = process.argv.find((argument) => argument.startsWith('--renderer='))?.split('=')[1] ?? 'hardware'
if (mode !== 'hardware' && mode !== 'software') throw new Error('Use --renderer=hardware or --renderer=software.')
const reportDir = process.env.REPORT_DIR ?? 'test-results'
mkdirSync(reportDir, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(mode === 'hardware'
    ? { channel: 'chromium', args: ['--enable-gpu', '--ignore-gpu-blocklist'] }
    : { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }),
})
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const network = []
  const responses = []
  const session = await page.context().newCDPSession(page)
  await session.send('Network.enable')
  session.on('Network.loadingFinished', (event) => network.push(event.encodedDataLength))
  session.on('Network.responseReceived', ({ response }) => {
    const encoding = Object.entries(response.headers).find(([key]) => key.toLowerCase() === 'content-encoding')?.[1] ?? 'identity'
    responses.push({ url: response.url, status: response.status, encoding })
  })
  await page.goto(`${process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173'}/?diagnostics=1`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-scene-status="ready"]', { timeout: 45_000 })
  await page.waitForFunction(() => window.__CHERNOBYL_ATLAS__?.ready, { timeout: 30_000 })
  await page.waitForTimeout(1200)
  const initial = await page.evaluate(() => {
    const value = window.__CHERNOBYL_ATLAS__
    if (!value) throw new Error('The renderer inspector is not available.')
    const resources = performance.getEntriesByType('resource').map((entry) => ({
      url: entry.name, transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize,
    }))
    const navigation = performance.getEntriesByType('navigation')[0]
    return { renderer: value.renderer, info: value.info, camera: value.camera, quality: value.quality, resources, navigation: { transferSize: navigation?.transferSize, encodedBodySize: navigation?.encodedBodySize } }
  })
  const runs = []
  for (let i = 0; i < 3; i++) {
    const result = await page.evaluate(async () => {
      const inspector = window.__CHERNOBYL_ATLAS__
      if (!inspector) throw new Error('The renderer inspector disappeared.')
      return inspector.measureOrbit(8)
    })
    runs.push(result)
    await page.waitForTimeout(450)
  }
  if (errors.length) throw new Error(`Browser errors during measurement: ${errors.join('; ')}`)
  const actualHardware = /intel|amd|nvidia|apple|qualcomm|adreno|mali|radeon|geforce/i.test(initial.renderer)
    && !/swiftshader|llvmpipe|software|microsoft basic render/i.test(initial.renderer)
  const result = {
    recordedAt: new Date().toISOString(),
    requestedRenderer: mode,
    actualHardware,
    browser: browser.version(),
    os: { platform: os.platform(), release: os.release(), architecture: os.arch(), cpu: os.cpus()[0]?.model, logicalProcessors: os.cpus().length, totalMemoryBytes: os.totalmem() },
    viewport: { width: 1920, height: 1080 },
    initial,
    actualLocalHttpResponseBytes: network.reduce((total, bytes) => total + bytes, 0),
    responseEncodings: responses,
    runs,
    allRunsMeet30Fps: runs.every((run) => run.averageFps >= 30),
    hardwareTargetVerified: actualHardware && runs.every((run) => run.averageFps >= 30),
    note: 'Actual HTTP bytes and Content-Encoding are recorded from Chromium CDP; independent per-file gzip/Brotli sizes are measured by measure-assets. Orbit measurement does not change the historical milestone. Software results are not hardware acceptance evidence.',
  }
  writeFileSync(join(reportDir, `performance-${mode}.json`), JSON.stringify(result, null, 2))
  await page.screenshot({ path: join(reportDir, `benchmark-${mode}.png`) })
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
