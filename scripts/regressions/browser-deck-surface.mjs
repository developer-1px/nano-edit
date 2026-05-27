import assert from 'node:assert/strict'
import {
  clickTarget,
  evaluate,
  scrollTargetIntoView,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'
import { appendText } from './browser-local-edit-actions.mjs'

const activeArtifactStorageKey = 'nano-edit:active-demo-document:v1'
const deckStorageKey = 'nano-edit:demo-deck:v1'
const headingEditText = ' / revised'
const tableEditText = ' + deck edit'

await withBrowserRegression('nano-edit-deck-surface-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await runDeckSurfaceLoop(browser, url)
  console.log('ok browser deck surface')
})

async function runDeckSurfaceLoop(browser, url) {
  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await evaluate(browser, `(() => {
    localStorage.removeItem(${JSON.stringify(activeArtifactStorageKey)})
    localStorage.removeItem(${JSON.stringify(deckStorageKey)})
    return true
  })()`)
  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, 'Boolean(document.querySelector(".demo-document-button[data-document-id=generated-deck-review]"))')

  await clickTarget(browser, '.demo-document-button[data-document-id="generated-deck-review"]')
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano-deck .ProseMirror.nano-document"))')

  const initial = await deckSnapshot(browser)
  assert.equal(initial.activeTitle, 'Generated Artifacts Need Edits')
  assert.equal(initial.slideCount, 3)
  assert.equal(initial.visibleDeck, true)
  assert.equal(initial.visibleCommandPalettes, 0)
  assert.equal(initial.visibleInspectorPanels, 0)

  await appendText(browser, '.nano-deck-frame .nano-heading-1[data-id] .nano-block-content', headingEditText)
  await waitForExpression(browser, `document.querySelector(".nano-deck-frame .nano-heading-1")?.textContent.includes(${JSON.stringify(headingEditText)})`)
  await waitForExpression(browser, storedDeckTextIncludesExpression(0, 0, 0, headingEditText))

  await clickTarget(browser, '.nano-deck-slide-button[data-slide-index="1"]')
  await waitForExpression(browser, 'document.querySelector(".nano-deck-frame .nano-heading-1 .nano-block-content")?.textContent.trim() === "Nano Deck Model"')
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano-deck-frame .nano-table[data-id] td[data-editable=true]"))')

  const tableCellSelector = '.nano-deck-frame .nano-table[data-id] td[data-row="1"][data-column="1"]'
  await scrollTargetIntoView(browser, tableCellSelector)
  await appendText(browser, tableCellSelector, tableEditText)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector)})?.textContent.includes(${JSON.stringify(tableEditText)})`)
  await waitForExpression(browser, storedDeckTableCellIncludesExpression(tableEditText))

  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano-deck .ProseMirror.nano-document"))')
  await waitForExpression(browser, `localStorage.getItem(${JSON.stringify(activeArtifactStorageKey)}) === "generated-deck-review"`)
  await waitForExpression(browser, storedDeckTextIncludesExpression(0, 0, 0, headingEditText))
  await waitForExpression(browser, storedDeckTableCellIncludesExpression(tableEditText))
}

async function deckSnapshot(browser) {
  return evaluate(browser, `(() => {
    return {
      activeTitle: document.querySelector('.nano-deck-frame .nano-heading-1 .nano-block-content')?.textContent?.trim() ?? '',
      slideCount: document.querySelectorAll('.nano-deck-slide-button').length,
      visibleDeck: Boolean(document.querySelector('.nano-deck')),
      visibleCommandPalettes: visibleCount('.nano-command-palette:not([hidden])'),
      visibleInspectorPanels: visibleCount('.inspector:not([hidden])'),
    }

    function visibleCount(selector) {
      return [...document.querySelectorAll(selector)].filter((element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity || 1) !== 0
          && box.width > 0
          && box.height > 0
      }).length
    }
  })()`)
}

function storedDeckTextIncludesExpression(slideIndex, regionIndex, blockIndex, text) {
  return `JSON.parse(localStorage.getItem(${JSON.stringify(deckStorageKey)}) || 'null')?.slides?.[${slideIndex}]?.regions?.[${regionIndex}]?.blocks?.[${blockIndex}]?.text?.includes(${JSON.stringify(text)}) === true`
}

function storedDeckTableCellIncludesExpression(text) {
  return `JSON.parse(localStorage.getItem(${JSON.stringify(deckStorageKey)}) || 'null')?.slides?.[1]?.regions?.[1]?.blocks?.find((block) => block.type === 'table')?.rows?.[1]?.[1]?.includes(${JSON.stringify(text)}) === true`
}
