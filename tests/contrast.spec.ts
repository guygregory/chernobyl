import { expect, test, type Page } from '@playwright/test'

async function textContrasts(page: Page) {
  return page.evaluate(() => {
    const selectors = [
      '.panel-tabs button', '.event-index', '.reactor-pill small', '.panel-footer',
      '.timeline-caption', '.timeline-footnote', '.muted', '.section-label',
      '.fine-print', '.source-link small', '.source-kind', '.source-record .source-date',
      '.source-maintenance', '.landmark-list-copy small', '.landmark-number', '.panel-intro',
      '.source-date-key > span', '.source-date-key strong',
      '.source-record p', '.confidence-note summary', '.event-date', '.era-chip',
    ]
    const rgb = (text: string): readonly [number, number, number, number] => {
      const values = text.match(/[\d.]+/g)?.map(Number)
      if (!values || values.length < 3) throw new Error(`Unsupported computed color ${text}.`)
      return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 1]
    }
    const luminance = (color: readonly number[]) => {
      const linear = color.slice(0, 3).map((channel) => channel / 255 <= .04045 ? channel / 255 / 12.92 : ((channel / 255 + .055) / 1.055) ** 2.4)
      return (linear[0] ?? 0) * .2126 + (linear[1] ?? 0) * .7152 + (linear[2] ?? 0) * .0722
    }
    return selectors.flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)].map((element) => {
      let parent: HTMLElement | null = element
      let background: readonly number[] | null = null
      while (parent) {
        const color = rgb(getComputedStyle(parent).backgroundColor)
        if (color[3] === 1) { background = color; break }
        parent = parent.parentElement
      }
      if (!background) throw new Error(`No opaque computed background for ${selector}.`)
      const foreground = rgb(getComputedStyle(element).color)
      const a = luminance(foreground), b = luminance(background)
      return { selector, text: element.textContent?.trim().slice(0, 80), foreground, background, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }
    }))
  })
}

test('small enabled labels and source metadata have at least 4.5:1 computed contrast', async ({ page }) => {
  await page.goto('/')
  for (const tab of ['History', 'Landmarks', 'Sources']) {
    await page.getByRole('tab', { name: tab, exact: true }).click()
    const values = await textContrasts(page)
    expect(values.length).toBeGreaterThan(10)
    expect(values.filter((value) => value.contrast < 4.5)).toEqual([])
  }
})
