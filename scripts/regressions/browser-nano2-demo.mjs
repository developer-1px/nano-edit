import assert from 'node:assert/strict'
import {
  clickTarget,
  evaluate,
  nano2ExampleStorageKey,
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
  await waitForExpression(browser, 'location.pathname === "/nano2/basics"')
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano2-example-link[data-example-id=\\"basics\\"]"))')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-link[data-example-id=\\"basics\\"]")?.getAttribute("aria-current") === "page"')
  await waitForExpression(browser, '!document.querySelector(".demo-artifact-button[data-artifact-id=\\"nano2\\"]")')
  assert.equal(await nano2ExampleHref(browser, 'basics'), '/nano2/basics')
  assert.equal(await nano2ExampleHref(browser, 'dinos'), '/nano2/dinos')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(editorSelector)}))`)
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(prosemirrorSelector)}))`)
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Basics")')
  await waitForExpression(browser, 'document.querySelector(".nano2 .nano-heading")?.textContent.includes("Basics")')

  const beforeParagraphCount = await paragraphCount(browser)
  await appendText(browser, paragraphSelector, ' PATCHED ')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(paragraphSelector)})?.textContent.includes("PATCHED")`)
  const modifier = process.platform === 'darwin' ? 4 : 2
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

  await wait(160)
  const storedBasics = await storedNano2Document(browser, 'basics')
  assert(storedBasics.blocks.some((block) => typeof block.text === 'string' && block.text.includes('PATCHED')))
  assert(storedBasics.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'bold' && block.text.slice(mark.from, mark.to).trim() === 'BOLD')))
  assert(storedBasics.blocks.some((block) => block.type === 'heading' && block.level === 2 && typeof block.text === 'string' && block.text.includes('PATCHED')))

  await clickTarget(browser, '.nano2-example-link[data-example-id="markdown"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/markdown"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-status")?.textContent === "planned"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-contract")?.textContent.includes("Markdown is a codec")')

  await clickTarget(browser, '.nano2-example-link[data-example-id="dinos"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/dinos"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-link[data-example-id=\\"dinos\\"]")?.getAttribute("aria-current") === "page"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Dinos")')
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
  await browser.send('Input.insertText', { text: ' ' })
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
  await wait(160)
  const storedDinos = await storedNano2Document(browser, 'dinos')
  assert(storedDinos.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'mention' && mark.id === 'mina' && mark.to - mark.from === 1)))
  assert(storedDinos.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'mention' && mark.id === 'avery' && mark.label === 'Avery' && mark.to - mark.from === 1)))
  assert(!storedDinos.blocks.some((block) => Array.isArray(block.marks) && block.marks.some((mark) => mark.type === 'mention' && mark.id === 'jules')))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-starter-kit"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-starter-kit"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap StarterKit")')
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 a')).some((node) => node.textContent === 'link' && node.getAttribute('href') === 'https://tiptap.dev')`)

  await setCursorAtBlockEndByText(browser, 'Inline target')
  await pressKey(browser, 'u', 'KeyU', 85, modifier)
  await browser.send('Input.insertText', { text: ' UNDER' })
  await pressKey(browser, 'u', 'KeyU', 85, modifier)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 u')).some((node) => node.textContent.includes('UNDER'))`)
  await pressKey(browser, 's', 'KeyS', 83, modifier | 8)
  await browser.send('Input.insertText', { text: ' STRIKE' })
  await pressKey(browser, 's', 'KeyS', 83, modifier | 8)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 s')).some((node) => node.textContent.includes('STRIKE'))`)
  await pressKey(browser, 'e', 'KeyE', 69, modifier)
  await browser.send('Input.insertText', { text: ' CODE' })
  await pressKey(browser, 'e', 'KeyE', 69, modifier)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-paragraph code')).some((node) => node.textContent.includes('CODE'))`)
  await pressKey(browser, 'Enter', 'Enter', 13, 8)
  await browser.send('Input.insertText', { text: 'AFTERBREAK' })
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-paragraph')).some((node) => node.textContent.includes('CODEAFTERBREAK') && node.querySelector('br'))`)

  await setCursorAtBlockEndByText(browser, 'Bullet target')
  await pressKey(browser, '8', 'Digit8', 56, modifier | 8)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-list-bullet')).some((node) => node.textContent.includes('Bullet target'))`)
  await setCursorAtBlockEndByText(browser, 'Ordered target')
  await pressKey(browser, '7', 'Digit7', 55, modifier | 8)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-list-ordered')).some((node) => node.textContent.includes('Ordered target'))`)
  await setCursorAtBlockEndByText(browser, 'Quote target')
  await pressKey(browser, 'b', 'KeyB', 66, modifier | 8)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-quote')).some((node) => node.textContent.includes('Quote target'))`)
  await setCursorAtBlockEndByText(browser, 'Code block target')
  await pressKey(browser, 'c', 'KeyC', 67, modifier | 1)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-code')).some((node) => node.textContent.includes('Code block target'))`)

  await wait(160)
  const storedStarterKit = await storedNano2Document(browser, 'tiptap-starter-kit')
  const inlineTarget = storedStarterKit.blocks.find((block) => typeof block.text === 'string' && block.text.includes('Inline target'))
  assert(inlineTarget)
  assert(inlineTarget.text.includes('CODE\nAFTERBREAK'))
  assert(inlineTarget.marks.some((mark) => mark.type === 'underline' && inlineTarget.text.slice(mark.from, mark.to).trim() === 'UNDER'))
  assert(inlineTarget.marks.some((mark) => mark.type === 'strike' && inlineTarget.text.slice(mark.from, mark.to).trim() === 'STRIKE'))
  assert(inlineTarget.marks.some((mark) => mark.type === 'code' && inlineTarget.text.slice(mark.from, mark.to).trim() === 'CODE'))
  assert(storedStarterKit.blocks.some((block) => block.type === 'list_item' && block.kind === 'bullet' && block.text.includes('Bullet target')))
  assert(storedStarterKit.blocks.some((block) => block.type === 'list_item' && block.kind === 'ordered' && block.text.includes('Ordered target')))
  assert(storedStarterKit.blocks.some((block) => block.type === 'quote' && block.text.includes('Quote target')))
  assert(storedStarterKit.blocks.some((block) => block.type === 'code' && block.text.includes('Code block target')))

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

async function setCursorAtBlockEndByText(browser, text) {
  return evaluate(browser, `(() => {
    const target = Array.from(document.querySelectorAll('.nano2 .nano-block'))
      .find((node) => node.textContent?.includes(${JSON.stringify(text)}))
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!target || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 block: ${text}')

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

async function storedNano2Document(browser, exampleId) {
  const storageKey = nano2ExampleStorageKey(exampleId)
  return evaluate(browser, storedPersistenceValueExpression(storageKey))
}

async function nano2ExampleHref(browser, exampleId) {
  return evaluate(browser, `new URL(document.querySelector(\`.nano2-example-link[data-example-id="${exampleId}"]\`)?.href ?? '', location.href).pathname`)
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
