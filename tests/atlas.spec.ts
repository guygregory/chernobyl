import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { milestones } from '../src/data/milestones'
import { resolveSiteState, sceneSignature, visibleLandmarkIds } from '../src/state/resolveSiteState'
import type { AtlasDiagnostics } from '../src/scene/diagnostics'

const screenshotDir = process.env.SCREENSHOT_DIR ?? resolve('test-results', 'visual')
mkdirSync(screenshotDir, { recursive: true })

async function ready(page: Page) {
  await expect(page.getByTestId('map')).toHaveAttribute('data-scene-status', 'ready')
  await expect(page.locator('canvas')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__CHERNOBYL_ATLAS__?.ready)).toBe(true)
}

async function diagnostics(page: Page): Promise<Omit<AtlasDiagnostics, 'measureOrbit'>> {
  return page.evaluate(() => {
    const value = window.__CHERNOBYL_ATLAS__
    if (!value) throw new Error('The real renderer diagnostics are not available.')
    return {
      ready: value.ready, milestoneId: value.milestoneId, signature: value.signature,
      present: value.present, quality: value.quality, camera: value.camera,
      renderer: value.renderer, info: value.info, renderedFrames: value.renderedFrames,
    }
  })
}

test('latest verified state has a real detailed WebGL canvas and honest source dates', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?diagnostics=1')
  await ready(page)
  await expect(page.getByRole('heading', { name: 'Restoration is still unfinished.' })).toBeVisible()
  await expect(page.locator('.date-note')).toContainText('State depicted')
  await expect(page.getByText('15 Sep 2026', { exact: true })).toBeVisible()
  await expect(page.getByText('16 Sep 2026', { exact: true })).toBeVisible()
  const value = await diagnostics(page)
  expect(value.info.triangles).toBeGreaterThan(10_000)
  expect(value.info.calls).toBeGreaterThan(15)
  expect(value.info.calls).toBeLessThan(100)
  expect(value.present).toContain('shelter')
  expect(value.present).toContain('nsc')
  expect(value.signature).toBe(sceneSignature(resolveSiteState('latest-2026')))
  expect(errors).toEqual([])
  await page.screenshot({ path: resolve(screenshotDir, 'desktop-latest.png'), fullPage: true })
})

test('all dates resolve identically in arbitrary order and keep the camera', async ({ page }) => {
  await page.goto('/?diagnostics=1')
  await ready(page)
  const before = (await diagnostics(page)).camera
  const order = [5, 0, 14, 7, 11, 3, 16, 10, 6, 1, 15, 12, 9, 4, 13, 2, 8]
  for (const index of order) {
    const milestone = milestones[index]
    if (!milestone) throw new Error(`Missing test milestone ${index}.`)
    await page.locator('#milestone-picker').selectOption(milestone.id)
    await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', milestone.id)
    await expect.poll(async () => (await diagnostics(page)).milestoneId).toBe(milestone.id)
    const current = await diagnostics(page)
    const expected = resolveSiteState(milestone.id)
    expect(current.signature).toBe(sceneSignature(expected))
    expect(current.present).toEqual(visibleLandmarkIds(expected))
    expect(current.camera.position).toEqual(before.position)
    expect(current.camera.target).toEqual(before.target)
    await expect(page.getByRole('heading', { name: milestone.title, exact: true })).toBeVisible()
  }
  await page.locator('#milestone-picker').selectOption('1986-before')
  await expect.poll(async () => (await diagnostics(page)).milestoneId).toBe('1986-before')
  await page.screenshot({ path: resolve(screenshotDir, 'desktop-1986-before.png'), fullPage: true })
  await page.locator('#milestone-picker').selectOption('1986-shelter')
  await expect.poll(async () => (await diagnostics(page)).milestoneId).toBe('1986-shelter')
  await page.screenshot({ path: resolve(screenshotDir, 'desktop-1986-shelter.png'), fullPage: true })
})

test('landmark selection, explicit focus, reset, zoom and keyboard map work', async ({ page }) => {
  await page.goto('/?diagnostics=1')
  await ready(page)
  const start = (await diagnostics(page)).camera
  await page.getByRole('button', { name: 'Select Reactor Unit 3', exact: true }).click()
  await expect(page.getByTestId('map')).toHaveAttribute('data-selected-landmark', 'unit-3')
  expect((await diagnostics(page)).camera.position).toEqual(start.position)
  await page.getByRole('button', { name: 'Focus this location', exact: true }).click()
  await expect.poll(async () => (await diagnostics(page)).camera.position).not.toEqual(start.position)
  const focus = (await diagnostics(page)).camera
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect.poll(async () => (await diagnostics(page)).camera.position).not.toEqual(focus.position)
  await page.getByRole('button', { name: 'Reset campus view', exact: true }).click()
  await expect.poll(async () => (await diagnostics(page)).camera.position).toEqual(start.position)
  const canvas = page.locator('canvas')
  await canvas.focus()
  await canvas.press('ArrowRight')
  await expect.poll(async () => (await diagnostics(page)).camera.target).not.toEqual(start.target)
  await canvas.press('Home')
  await expect.poll(async () => (await diagnostics(page)).camera.target).toEqual(start.target)
  await canvas.press('Shift+ArrowLeft')
  await expect.poll(async () => (await diagnostics(page)).camera.position).not.toEqual(start.position)
  await page.getByRole('button', { name: 'Show landmark labels' }).click()
  await expect(page.getByRole('button', { name: 'Select Reactor Unit 3' })).toHaveCount(0)
})

test('valid, unavailable-at-date and invalid deep links remain explicit', async ({ page }) => {
  await page.goto('/?diagnostics=1#milestone=1986-shelter&landmark=shelter')
  await ready(page)
  await expect(page.getByRole('heading', { name: 'The original Shelter', exact: true })).toBeVisible()
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '1986-shelter')
  await page.goto('/?diagnostics=1#milestone=1972-foundations&landmark=nsc')
  await ready(page)
  await expect(page.getByText('Not present at this milestone.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Focus this location' })).toBeDisabled()
  await page.goto('/?diagnostics=1#milestone=not-a-date&landmark=town')
  await ready(page)
  await expect(page.getByRole('alert')).toContainText('Unknown milestone')
  await expect(page.getByRole('alert')).toContainText('Unknown landmark')
  await page.getByRole('button', { name: 'Reset link' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page).toHaveURL(/#milestone=latest-2026$/)
})

test('the skip link focuses the timeline without overwriting a historical deep link', async ({ page }) => {
  await page.goto('/?diagnostics=1#milestone=1986-shelter&landmark=shelter')
  await ready(page)
  const url = page.url()
  await page.getByRole('link', { name: 'Skip to historical timeline' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#milestone-picker')).toBeFocused()
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '1986-shelter')
  await expect(page.getByTestId('map')).toHaveAttribute('data-selected-landmark', 'shelter')
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(page.url()).toBe(url)
})

test('missing WebGL still offers the complete keyboard-accessible history and landmarks', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, ...args: Parameters<HTMLCanvasElement['getContext']>) {
        if (args[0] === 'webgl2' || args[0] === 'webgl') return null
        return Reflect.apply(original, this, args)
      },
    })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '3D view unavailable.' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('WebGL 2')
  await page.locator('#milestone-picker').selectOption('1986-shelter')
  await expect(page.getByRole('heading', { name: 'A first protective envelope.' })).toBeVisible()
  await page.getByRole('tab', { name: 'Landmarks' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: /06 New Safe Confinement/ }).click()
  await expect(page.getByRole('heading', { name: 'New Safe Confinement', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Landmarks' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Sources' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('link', { name: /IAEA assistance for restoration/ })).toBeVisible()
  await page.screenshot({ path: resolve(screenshotDir, 'no-webgl-history.png'), fullPage: true })
})

test('a failed local asset request is reported and can be retried', async ({ page }) => {
  await page.route('**/site-manifest.json', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto('/?diagnostics=1')
  await expect(page.getByRole('heading', { name: '3D view unavailable.' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('HTTP 503')
  await expect(page.getByRole('heading', { name: 'Restoration is still unfinished.' })).toBeVisible()
  await page.unroute('**/site-manifest.json')
  await page.getByRole('button', { name: 'Retry 3D view' }).click()
  await ready(page)
})

test('an interrupted 3D module download reports an error and reloads the same historical link on retry', async ({ page }) => {
  await page.route('**/PlantScene-*.js', (route) => route.abort('failed'))
  await page.goto('/?diagnostics=1#milestone=1986-before&landmark=unit-4')
  await expect(page.getByRole('heading', { name: '3D view unavailable.' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('renderer could not start')
  await expect(page.getByRole('heading', { name: 'The four-unit generating plant.' })).toBeVisible()
  await page.unroute('**/PlantScene-*.js')
  await page.getByRole('button', { name: 'Retry 3D view' }).click()
  await ready(page)
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '1986-before')
  await expect(page.getByTestId('map')).toHaveAttribute('data-selected-landmark', 'unit-4')
  await expect(page).toHaveURL(/#milestone=1986-before&landmark=unit-4$/)
})

test('actual GPU context loss has a truthful fallback and retains the selected history on retry', async ({ page }) => {
  await page.goto('/?diagnostics=1#milestone=1986-shelter')
  await ready(page)
  const supported = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const context = canvas?.getContext('webgl2')
    const extension = context?.getExtension('WEBGL_lose_context')
    if (!extension) return false
    extension.loseContext()
    return true
  })
  expect(supported).toBe(true)
  await expect(page.getByRole('alert')).toContainText('graphics context was lost')
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '1986-shelter')
  await page.getByRole('button', { name: 'Retry 3D view' }).click()
  await ready(page)
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '1986-shelter')
})

test('narrow touch layout, reduced motion, field notes and date controls fit without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?diagnostics=1')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Field notes' })).toBeVisible()
  const width = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }))
  expect(width.body).toBeLessThanOrEqual(width.viewport)
  await expect(page.locator('.brand')).toBeInViewport()
  await expect(page.getByRole('heading', { name: 'A site through time.' })).toBeInViewport()
  const canvasBounds = await page.locator('canvas').boundingBox()
  expect(canvasBounds?.width).toBe(390)
  expect(canvasBounds?.x).toBe(0)
  expect(await page.locator('.atlas-app').evaluate((element) => element.scrollLeft)).toBe(0)
  await page.screenshot({ path: resolve(screenshotDir, 'mobile-latest.png'), fullPage: true })
  await page.getByRole('button', { name: 'Field notes' }).click()
  await expect(page.getByRole('heading', { name: 'Restoration is still unfinished.' })).toBeVisible()
  await page.screenshot({ path: resolve(screenshotDir, 'mobile-field-notes.png'), fullPage: true })
  await page.getByRole('button', { name: 'Collapse field notes' }).click()
  await page.getByRole('button', { name: 'Previous milestone' }).click()
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '2025-cladding-closed')
  await page.locator('#milestone-picker').selectOption('1972-foundations')
  await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '1972-foundations')
  await expect(page.getByRole('button', { name: 'Previous milestone' })).toBeDisabled()
})

test('real touch drag and pinch move the camera and touch controls remain operable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
  try {
    const page = await context.newPage()
    await page.goto(`${process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173'}/?diagnostics=1`)
    await ready(page)
    const session = await context.newCDPSession(page)
    const start = (await diagnostics(page)).camera
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 425, id: 0 }] })
    for (let i = 1; i <= 8; i++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190 - i * 9, y: 425 - i * 2, id: 0 }] })
      await page.waitForTimeout(25)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(async () => (await diagnostics(page)).camera.position).not.toEqual(start.position)
    const distance = (value: Awaited<ReturnType<typeof diagnostics>>) => Math.hypot(...value.camera.position.map((n, i) => n - (value.camera.target[i] ?? 0)))
    const beforePinch = distance(await diagnostics(page))
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 145, y: 435, id: 0 }, { x: 225, y: 435, id: 1 }] })
    for (let i = 1; i <= 6; i++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 145 - i * 7, y: 435, id: 0 }, { x: 225 + i * 7, y: 435, id: 1 }] })
      await page.waitForTimeout(25)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(async () => distance(await diagnostics(page))).toBeLessThan(beforePinch * .95)
    await page.getByRole('button', { name: 'Field notes' }).tap()
    await expect(page.getByRole('heading', { name: 'Restoration is still unfinished.' })).toBeInViewport()
    await page.getByRole('button', { name: 'Collapse field notes' }).tap()
    await page.getByRole('button', { name: 'Previous milestone' }).tap()
    await expect(page.getByTestId('map')).toHaveAttribute('data-milestone', '2025-cladding-closed')
    await page.getByRole('button', { name: 'Reset campus view' }).tap()
    await expect.poll(async () => Math.hypot(...(await diagnostics(page)).camera.position.map((n, i) => n - (start.position[i] ?? 0)))).toBeLessThan(1e-6)
    await page.screenshot({ path: resolve(screenshotDir, 'mobile-touch.png'), fullPage: true })
  } finally {
    await context.close()
  }
})

test('geometry and texture memory stay bounded after repeated arbitrary switching', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/?diagnostics=1')
  await ready(page)
  const before = (await diagnostics(page)).info
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const id of ['1972-foundations', '1986-before', '2025-nsc-damage', '1986-shelter', '2013-stack', 'latest-2026']) {
      await page.locator('#milestone-picker').selectOption(id)
      await expect.poll(async () => (await diagnostics(page)).milestoneId).toBe(id)
    }
  }
  const after = (await diagnostics(page)).info
  expect(after.geometries).toBeLessThanOrEqual(before.geometries + 8)
  expect(after.textures).toBeLessThanOrEqual(before.textures + 1)
  expect(after.objects).toBeLessThanOrEqual(before.objects + 5)
})
