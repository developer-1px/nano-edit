import assert from 'node:assert/strict'
import {
  clickTarget,
  demoStorageKey,
  evaluate,
  pressKey,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'

const activeArtifactStorageKey = 'nano-edit:active-demo-document:v1'
const storageKey = demoStorageKey()
const emptyDocument = {
  blocks: [{ id: 'slash-empty', type: 'paragraph', text: '', marks: [] }],
}

await withBrowserRegression('nano-edit-command-surface-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await runCommandSurfaceLoop(browser, url)
  console.log('ok browser command surface')
})

async function runCommandSurfaceLoop(browser, url) {
  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await evaluate(browser, `(() => {
    localStorage.removeItem(${JSON.stringify(activeArtifactStorageKey)})
    localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(emptyDocument))})
    return true
  })()`)
  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano-paragraph[data-id=slash-empty]"))')

  await focusEmptySlashBlock(browser)
  await browser.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: '/',
    code: 'Slash',
    windowsVirtualKeyCode: 191,
    nativeVirtualKeyCode: 191,
  })
  await browser.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: '/',
    code: 'Slash',
    windowsVirtualKeyCode: 191,
    nativeVirtualKeyCode: 191,
  })
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano-command-palette:not([hidden])"))')
  const slash = await slashSnapshot(browser)
  assert.equal(slash.blockText, '')
  assert.equal(slash.focusedInput, true)
  assert(slash.paletteText.includes('Heading 1'))
  assert(slash.paletteText.includes('Table'))

  await pressKey(browser, 'ArrowDown', 'ArrowDown', 40)
  const firstMove = await commandPaletteSelectionSnapshot(browser)
  assert.equal(firstMove.focusedInput, true)
  assert.equal(firstMove.selectedIndex, 1)
  assert.equal(firstMove.activeDescendant.endsWith('-option-1'), true)
  assert.equal(firstMove.selectedVisible, true)

  for (let index = 0; index < 23; index += 1) {
    await pressKey(browser, 'ArrowDown', 'ArrowDown', 40)
  }
  const scrolledMove = await commandPaletteSelectionSnapshot(browser)
  assert.equal(scrolledMove.focusedInput, true)
  assert.equal(scrolledMove.selectedIndex, 24)
  assert.equal(scrolledMove.selectedVisible, true)
  assert(scrolledMove.scrollTop > 0)

  await pressKey(browser, 'ArrowUp', 'ArrowUp', 38)
  const upwardMove = await commandPaletteSelectionSnapshot(browser)
  assert.equal(upwardMove.selectedIndex, 23)
  assert.equal(upwardMove.selectedVisible, true)

  await browser.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  })
  await browser.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  })
  await waitForExpression(browser, '!Boolean(document.querySelector(".nano-command-palette:not([hidden])"))')

  await clickTarget(browser, '.demo-document-button[data-document-id="part-catalog"]')
  await waitForExpression(browser, 'document.querySelector(".nano-heading-1")?.textContent.includes("Content Catalog")')
  const catalog = await catalogSnapshot(browser)
  assert(catalog.activeTitle.includes('Content Catalog'))
  assert(catalog.bodyText.includes('Inline text'))
  assert(catalog.bodyText.includes('Quick edit'))
  assert.equal(catalog.hasTodo, true)
  assert.equal(catalog.hasCallout, true)
  assert.equal(catalog.hasCode, true)
  assert.equal(catalog.hasTable, true)
  assert.equal(catalog.hasImage, true)
  assert.equal(catalog.hasBookmark, true)
  assert.equal(catalog.hasAttachment, true)
  assert.equal(catalog.hasNoteRef, true)
  assert.equal(catalog.hasTagRef, true)
  assert.equal(catalog.hasInlineLink, true)
  assert.equal(catalog.hasInlineTag, true)
  assert.equal(catalog.hasInlineMath, true)
  assert.equal(catalog.hasFootnoteRef, true)
}

async function slashSnapshot(browser) {
  return evaluate(browser, `(() => ({
    blockText: document.querySelector('.nano-paragraph[data-id="slash-empty"]')?.textContent ?? '',
    focusedInput: document.activeElement?.classList.contains('nano-command-input') === true,
    paletteText: document.querySelector('.nano-command-palette:not([hidden])')?.textContent ?? '',
  }))()`)
}

async function commandPaletteSelectionSnapshot(browser) {
  return evaluate(browser, `(() => {
    const input = document.querySelector('.nano-command-input')
    const list = document.querySelector('.nano-command-list')
    const selected = document.querySelector('.nano-command-option[data-selected="true"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing command input')
    if (!(list instanceof HTMLElement)) throw new Error('Missing command list')
    if (!(selected instanceof HTMLElement)) throw new Error('Missing selected command option')

    const listRect = list.getBoundingClientRect()
    const selectedRect = selected.getBoundingClientRect()
    return {
      activeDescendant: input.getAttribute('aria-activedescendant') ?? '',
      focusedInput: document.activeElement === input,
      scrollTop: list.scrollTop,
      selectedIndex: [...document.querySelectorAll('.nano-command-option')].indexOf(selected),
      selectedVisible: selectedRect.top >= listRect.top - 1 && selectedRect.bottom <= listRect.bottom + 1,
    }
  })()`)
}

async function focusEmptySlashBlock(browser) {
  await clickTarget(browser, '.nano-paragraph[data-id="slash-empty"]')
  await evaluate(browser, `(() => {
    const block = document.querySelector('.nano-paragraph[data-id="slash-empty"]')
    if (!(block instanceof HTMLElement)) throw new Error('Missing slash block')
    block.focus()
    const range = document.createRange()
    range.selectNodeContents(block)
    range.collapse(false)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    return true
  })()`)
}

async function catalogSnapshot(browser) {
  return evaluate(browser, `(() => ({
    activeTitle: document.querySelector('.nano-heading-1')?.textContent?.trim() ?? '',
    bodyText: document.body.textContent ?? '',
    hasTodo: Boolean(document.querySelector('.nano-todo')),
    hasCallout: Boolean(document.querySelector('.nano-callout')),
    hasCode: Boolean(document.querySelector('.nano-code')),
    hasTable: Boolean(document.querySelector('.nano-table')),
    hasImage: Boolean(document.querySelector('.nano-image')),
    hasBookmark: Boolean(document.querySelector('.nano-bookmark')),
    hasAttachment: Boolean(document.querySelector('.nano-attachment')),
    hasNoteRef: Boolean(document.querySelector('.nano-note-ref')),
    hasTagRef: Boolean(document.querySelector('.nano-tag-ref')),
    hasInlineLink: Boolean(document.querySelector('.nano-md-link')),
    hasInlineTag: Boolean(document.querySelector('.nano-tag')),
    hasInlineMath: Boolean(document.querySelector('.nano-math')),
    hasFootnoteRef: Boolean(document.querySelector('.nano-footnote-ref')),
  }))()`)
}
