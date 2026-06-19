import assert from 'node:assert/strict'
import {
  clickTarget,
  demoDocumentStorageKey,
  evaluate,
  pressKey,
  storedPersistenceValueExpression,
  wait,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'
import { appendText } from './browser-local-edit-actions.mjs'

const editorSelector = '.nano2-editor'
const prosemirrorSelector = '.nano2 .ProseMirror'
const paragraphSelector = '.nano2 .nano-paragraph'
const mentionSelector = '.nano2-mention-suggestion:not([hidden])'

await withBrowserRegression('nano-edit-nano2-demo-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await browser.send('Page.navigate', { url: `${url}artifacts/nano2` })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await waitForExpression(browser, 'Boolean(document.querySelector(".demo-artifact-button[data-artifact-id=\\"nano2\\"]"))')
  await waitForExpression(browser, 'location.pathname === "/artifacts/nano2"')
  await waitForExpression(browser, 'document.querySelector(".demo-artifact-button[data-artifact-id=\\"nano2\\"]")?.getAttribute("aria-current") === "page"')
  assert.equal(await nano2Href(browser), '/artifacts/nano2')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(editorSelector)}))`)
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(prosemirrorSelector)}))`)
  await waitForExpression(browser, 'document.querySelector(".nano2 .nano-heading")?.textContent.includes("Nano2")')

  const beforeParagraphCount = await paragraphCount(browser)
  await appendText(browser, paragraphSelector, ' PATCHED ')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.includes("PATCHED")`)
  await insertMention(browser, 'mi', '@Mina')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.includes("@Mina")`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-mention-chip')?.textContent === '@Mina'`)
  assert.deepEqual(await firstMentionChipRuntimeState(browser), {
    contenteditable: 'false',
    draggable: true,
    id: 'mina',
    label: 'Mina',
    pmViewDesc: true,
    text: '@Mina',
  })
  const copiedMention = await copyFirstMentionChip(browser)
  assert.equal(copiedMention.prevented, true)
  assert(copiedMention.html.includes('data-mention-id="mina"'))
  assert(copiedMention.html.includes('data-mention-label="Mina"'))
  await setCursorAtFirstParagraphEnd(browser)
  await insertMention(browser, 'ju', '@Jules')
  await waitForExpression(browser, `document.querySelectorAll('.nano2 .nano-mention-chip').length === 2`)
  await pressKey(browser, 'Backspace', 'Backspace', 8)
  await pressKey(browser, 'Backspace', 'Backspace', 8)
  await waitForExpression(browser, `document.querySelectorAll('.nano2 .nano-mention-chip').length === 1`)
  await waitForExpression(browser, `!document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.includes("@Jules")`)
  await pasteMentionChip(browser, 'avery', 'Avery')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-mention-chip[data-mention-id="avery"]'))`)
  await browser.send('Input.insertText', { text: ' AFTERCHIP' })
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.endsWith("AFTERCHIP")`)
  const modifier = process.platform === 'darwin' ? 4 : 2
  await assertTextblockEndKeySkipsMention(browser, {
    key: 'ArrowRight',
    code: 'ArrowRight',
    keyCode: 39,
    marker: ' CMDEND',
    modifiers: modifier,
  })
  await assertTextblockEndKeySkipsMention(browser, {
    key: 'End',
    code: 'End',
    keyCode: 35,
    marker: ' ENDKEY',
  })
  await pressKey(browser, 'b', 'KeyB', 66, modifier)
  await browser.send('Input.insertText', { text: ' BOLD' })
  await pressKey(browser, 'b', 'KeyB', 66, modifier)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 strong')).some((node) => node.textContent.includes('BOLD'))`)

  await dispatchEnterKeydownAndBeforeInput(browser)
  await waitForExpression(browser, `document.querySelectorAll(${JSON.stringify(paragraphSelector)}).length === ${beforeParagraphCount + 1}`)

  const beforePhysicalEnterCount = await paragraphCount(browser)
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, `document.querySelectorAll(${JSON.stringify(paragraphSelector)}).length > ${beforePhysicalEnterCount}`)
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, `document.querySelectorAll(${JSON.stringify(paragraphSelector)}).length > ${beforePhysicalEnterCount + 1}`)
  await waitForExpression(browser, `Array.from(document.querySelectorAll(${JSON.stringify(paragraphSelector)})).slice(-2).every((block) => block.getBoundingClientRect().height > 10)`)
  await waitForExpression(browser, `lastNano2ParagraphGap() <= 2`, withNano2ParagraphGap)

  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, `document.querySelectorAll(${JSON.stringify(paragraphSelector)}).length === ${beforePhysicalEnterCount + 1}`)
  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, `document.querySelectorAll(${JSON.stringify(paragraphSelector)}).length === ${beforePhysicalEnterCount}`)
  await setCursorAtFirstParagraphEnd(browser)
  await pressKey(browser, '2', 'Digit2', 50, 10)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-heading')).some((node) => node.textContent.includes('PATCHED'))`)

  await clickTarget(browser, '.demo-artifact-button[data-artifact-id="overview"]')
  const stored = await storedNano2Document(browser)
  assert(stored.blocks.some((block) => typeof block.text === 'string' && block.text.includes('PATCHED')))
  assert(stored.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'mention' && mark.id === 'mina' && mark.to - mark.from === 1)))
  assert(stored.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'mention' && mark.id === 'avery' && mark.label === 'Avery' && mark.to - mark.from === 1)))
  assert(stored.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'bold' && block.text.slice(mark.from, mark.to).trim() === 'BOLD')))
  assert(stored.blocks.some((block) => block.type === 'heading' && block.level === 2 && typeof block.text === 'string' && block.text.includes('PATCHED')))
  assert(!stored.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'mention' && mark.id === 'jules')))

  console.log('ok browser nano2 demo')
})

async function paragraphCount(browser) {
  return evaluate(browser, `document.querySelectorAll(${JSON.stringify(paragraphSelector)}).length`)
}

async function dispatchEnterKeydownAndBeforeInput(browser) {
  return evaluate(browser, `(() => {
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!(editor instanceof HTMLElement)) throw new Error('Missing nano2 editor')

    const keydown = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      code: 'Enter',
    })
    editor.dispatchEvent(keydown)

    const beforeInput = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertParagraph',
      data: null,
    })
    editor.dispatchEvent(beforeInput)

    return {
      keydownPrevented: keydown.defaultPrevented,
      beforeInputPrevented: beforeInput.defaultPrevented,
    }
  })()`)
}

async function insertMention(browser, query, expectedText) {
  await browser.send('Input.insertText', { text: '@' })
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(mentionSelector)}))`)
  await waitForExpression(browser, `document.activeElement?.classList.contains('nano2-mention-input')`)
  await browser.send('Input.insertText', { text: query })
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(mentionSelector)})?.textContent.includes(${JSON.stringify(expectedText)})`)
  await pressKey(browser, 'Enter', 'Enter', 13)
}

async function assertTextblockEndKeySkipsMention(browser, { key, code, keyCode, marker, modifiers }) {
  await setCursorBeforeFirstMentionChip(browser)
  await pressKey(browser, key, code, keyCode, modifiers)
  await browser.send('Input.insertText', { text: marker })
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.endsWith(${JSON.stringify(marker)})`)
  await waitForExpression(browser, `!document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.includes(${JSON.stringify(`${marker}@Mina`)})`)
}

async function copyFirstMentionChip(browser) {
  await setSelectionAroundFirstMentionChip(browser)
  await wait(80)
  return evaluate(browser, `(() => {
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!(editor instanceof HTMLElement)) throw new Error('Missing nano2 editor')

    const data = new DataTransfer()
    const event = new ClipboardEvent('copy', {
      bubbles: true,
      cancelable: true,
      clipboardData: data,
    })
    editor.dispatchEvent(event)
    return {
      html: data.getData('text/html'),
      prevented: event.defaultPrevented,
      text: data.getData('text/plain'),
    }
  })()`)
}

async function firstMentionChipRuntimeState(browser) {
  return evaluate(browser, `(() => {
    const chip = document.querySelector('.nano2 .nano-mention-chip')
    if (!(chip instanceof HTMLElement)) throw new Error('Missing nano2 mention chip')
    return {
      contenteditable: chip.getAttribute('contenteditable'),
      draggable: chip.draggable,
      id: chip.dataset.mentionId,
      label: chip.dataset.mentionLabel,
      pmViewDesc: Boolean(chip.pmViewDesc),
      text: chip.textContent,
    }
  })()`)
}

async function pasteMentionChip(browser, id, label) {
  await setCursorAtFirstParagraphEnd(browser)
  return evaluate(browser, `(() => {
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!(editor instanceof HTMLElement)) throw new Error('Missing nano2 editor')

    const data = new DataTransfer()
    data.setData('text/html', ${JSON.stringify(`<span class="nano-mention-chip" data-mention-id="${id}" data-mention-label="${label}" contenteditable="false" draggable="true">@${label}</span>`)})
    data.setData('text/plain', ${JSON.stringify(`@${label}`)})
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: data,
    })
    editor.dispatchEvent(event)
    return event.defaultPrevented
  })()`)
}

async function setCursorAtFirstParagraphEnd(browser) {
  return evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(paragraphSelector)})
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!target || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 paragraph')

    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(false)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    return true
  })()`)
}

async function setCursorBeforeFirstMentionChip(browser) {
  return evaluate(browser, `(() => {
    const chip = document.querySelector('.nano2 .nano-mention-chip')
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!chip || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 mention chip')

    editor.focus()
    const range = document.createRange()
    range.setStartBefore(chip)
    range.collapse(true)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    return true
  })()`)
}

async function setSelectionAroundFirstMentionChip(browser) {
  return evaluate(browser, `(() => {
    const chip = document.querySelector('.nano2 .nano-mention-chip')
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!chip || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 mention chip')

    editor.focus()
    const range = document.createRange()
    range.setStartBefore(chip)
    range.setEndAfter(chip)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    return true
  })()`)
}

async function storedNano2Document(browser) {
  const storageKey = `${demoDocumentStorageKey()}:nano2`
  return evaluate(browser, storedPersistenceValueExpression(storageKey))
}

async function nano2Href(browser) {
  return evaluate(browser, `new URL(document.querySelector('.demo-artifact-button[data-artifact-id="nano2"]')?.href ?? '', location.href).pathname`)
}

function withNano2ParagraphGap(expression) {
  return `(() => {
    function lastNano2ParagraphGap() {
      const blocks = Array.from(document.querySelectorAll(${JSON.stringify(paragraphSelector)}))
      const previous = blocks.at(-2)
      const current = blocks.at(-1)
      if (!previous || !current) return Number.POSITIVE_INFINITY
      return current.getBoundingClientRect().top - previous.getBoundingClientRect().bottom
    }
    return ${expression}
  })()`
}
