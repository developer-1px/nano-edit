import assert from 'node:assert/strict'
import {
  clickTarget,
  evaluate,
  nano2ExampleStorageKey,
  persistenceSnapshotText,
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
  await browser.send('Page.navigate', { url: `${url}nano2` })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await waitForExpression(browser, 'location.pathname === "/nano2/basics"')
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano2-example-link[data-example-id=\\"basics\\"]"))')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-link[data-example-id=\\"basics\\"]")?.getAttribute("aria-current") === "page"')
  await waitForExpression(browser, '!document.querySelector(".demo-artifact-button[data-artifact-id=\\"nano2\\"]")')
  assert.equal(await nano2ExampleHref(browser, 'basics'), '/nano2/basics')
  assert.equal(await nano2ExampleHref(browser, 'dinos'), '/nano2/dinos')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-default-editor'), '/nano2/tiptap-default-editor')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-text-direction'), '/nano2/tiptap-text-direction')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-clever-editor'), '/nano2/tiptap-clever-editor')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-collaboration'), '/nano2/tiptap-collaboration')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-drawing'), '/nano2/tiptap-drawing')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-forced-content-structure'), '/nano2/tiptap-forced-content-structure')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-long-texts'), '/nano2/tiptap-long-texts')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-menus'), '/nano2/tiptap-menus')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-mentions'), '/nano2/tiptap-mentions')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-slash-commands'), '/nano2/tiptap-slash-commands')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-syntax-highlighting'), '/nano2/tiptap-syntax-highlighting')
  assert.equal(await nano2ExampleHref(browser, 'tiptap-minimal-setup'), '/nano2/tiptap-minimal-setup')
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

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-default-editor"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-default-editor"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Default Editor")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'default'`)

  await setCursorAtBlockEndById(browser, 'nano2-default-inline-target')
  await pressKey(browser, 'b', 'KeyB', 66, modifier)
  await browser.send('Input.insertText', { text: ' BOLD' })
  await pressKey(browser, 'b', 'KeyB', 66, modifier)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-default-inline-target"] strong'))`)

  await setCursorAtBlockEndById(browser, 'nano2-default-heading-target')
  await pressKey(browser, '2', 'Digit2', 50, 10)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading-2[data-id="nano2-default-heading-target"]')?.textContent.includes('Heading default target')`)

  await setCursorAtBlockEndById(browser, 'nano2-default-list-target')
  await pressKey(browser, '8', 'Digit8', 56, modifier | 8)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-list-bullet[data-id="nano2-default-list-target"]')?.textContent.includes('List default target')`)

  await setCursorAtBlockEndById(browser, 'nano2-default-quote-target')
  await pressKey(browser, 'b', 'KeyB', 66, modifier | 8)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-quote[data-id="nano2-default-quote-target"]')?.textContent.includes('Quote default target')`)

  await wait(160)
  const storedDefaultEditor = await storedNano2Document(browser, 'tiptap-default-editor')
  const defaultInline = storedDefaultEditor.blocks.find((block) => block.id === 'nano2-default-inline-target')
  assert(defaultInline)
  assert(defaultInline.marks.some((mark) => mark.type === 'bold' && defaultInline.text.slice(mark.from, mark.to).trim() === 'BOLD'))
  assert(storedDefaultEditor.blocks.some((block) => block.id === 'nano2-default-heading-target' && block.type === 'heading' && block.level === 2))
  assert(storedDefaultEditor.blocks.some((block) => block.id === 'nano2-default-list-target' && block.type === 'list_item' && block.kind === 'bullet'))
  assert(storedDefaultEditor.blocks.some((block) => block.id === 'nano2-default-quote-target' && block.type === 'quote'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-formatting"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-formatting"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Formatting")')

  await setCursorAtBlockEndById(browser, 'nano2-formatting-mark-target')
  await pressKey(browser, 'b', 'KeyB', 66, modifier)
  await browser.send('Input.insertText', { text: ' BOLD' })
  await pressKey(browser, 'b', 'KeyB', 66, modifier)
  await pressKey(browser, 'i', 'KeyI', 73, modifier)
  await browser.send('Input.insertText', { text: ' ITALIC' })
  await pressKey(browser, 'i', 'KeyI', 73, modifier)
  await pressKey(browser, 'u', 'KeyU', 85, modifier)
  await browser.send('Input.insertText', { text: ' UNDER' })
  await pressKey(browser, 'u', 'KeyU', 85, modifier)
  await pressKey(browser, 's', 'KeyS', 83, modifier | 8)
  await browser.send('Input.insertText', { text: ' STRIKE' })
  await pressKey(browser, 's', 'KeyS', 83, modifier | 8)
  await pressKey(browser, 'e', 'KeyE', 69, modifier)
  await browser.send('Input.insertText', { text: ' CODE' })
  await pressKey(browser, 'e', 'KeyE', 69, modifier)

  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-formatting-mark-target"] strong'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-formatting-mark-target"] em'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-formatting-mark-target"] u'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-formatting-mark-target"] s'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-formatting-mark-target"] code'))`)

  await setCursorAtBlockEndById(browser, 'nano2-formatting-heading-target')
  await pressKey(browser, '3', 'Digit3', 51, 10)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading-3[data-id="nano2-formatting-heading-target"]')?.textContent.includes('Heading target')`)

  await wait(160)
  const storedFormatting = await storedNano2Document(browser, 'tiptap-formatting')
  const formattingTarget = storedFormatting.blocks.find((block) => block.id === 'nano2-formatting-mark-target')
  assert(formattingTarget)
  assert(formattingTarget.marks.some((mark) => mark.type === 'bold' && formattingTarget.text.slice(mark.from, mark.to).trim() === 'BOLD'))
  assert(formattingTarget.marks.some((mark) => mark.type === 'italic' && formattingTarget.text.slice(mark.from, mark.to).trim() === 'ITALIC'))
  assert(formattingTarget.marks.some((mark) => mark.type === 'underline' && formattingTarget.text.slice(mark.from, mark.to).trim() === 'UNDER'))
  assert(formattingTarget.marks.some((mark) => mark.type === 'strike' && formattingTarget.text.slice(mark.from, mark.to).trim() === 'STRIKE'))
  assert(formattingTarget.marks.some((mark) => mark.type === 'code' && formattingTarget.text.slice(mark.from, mark.to).trim() === 'CODE'))
  assert(storedFormatting.blocks.some((block) => block.id === 'nano2-formatting-heading-target' && block.type === 'heading' && block.level === 3 && block.text === 'Heading target'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-text-direction"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-text-direction"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Text Direction")')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-paragraph[data-id="nano2-direction-rtl"]')?.getAttribute('dir') === 'rtl'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-list-item[data-id="nano2-direction-list"]')?.getAttribute('dir') === 'rtl'`)

  await setCursorAtBlockEndById(browser, 'nano2-direction-ltr-target')
  await pressKey(browser, 'l', 'KeyL', 76, modifier | 1)
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-direction-ltr-target"]')?.getAttribute('dir') === 'ltr'`)

  await setCursorAtBlockEndById(browser, 'nano2-direction-auto-target')
  await pressKey(browser, 'a', 'KeyA', 65, modifier | 1)
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-direction-auto-target"]')?.getAttribute('dir') === 'auto'`)

  await wait(160)
  const storedDirection = await storedNano2Document(browser, 'tiptap-text-direction')
  assert(storedDirection.blocks.some((block) => block.id === 'nano2-direction-rtl' && block.textDirection === 'rtl'))
  assert(storedDirection.blocks.some((block) => block.id === 'nano2-direction-ltr-target' && block.textDirection === 'ltr'))
  assert(storedDirection.blocks.some((block) => block.id === 'nano2-direction-auto-target' && block.textDirection === 'auto'))
  assert(storedDirection.blocks.some((block) => block.id === 'nano2-direction-list' && block.textDirection === 'rtl'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-clever-editor"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-clever-editor"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Clever Editor")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'clever'`)

  await setCursorAtBlockEndById(browser, 'nano2-clever-emoji')
  await typeCharacters(browser, ':)')
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-clever-emoji"]')?.textContent === '🙂'`)

  await setCursorAtBlockEndById(browser, 'nano2-clever-typography')
  await typeCharacters(browser, '-> (c)')
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-clever-typography"]')?.textContent === '→ ©'`)

  await setCursorAtBlockEndById(browser, 'nano2-clever-highlight')
  await typeCharacters(browser, '==bright==')
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-clever-highlight"]')?.textContent === 'bright'`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-clever-highlight"] mark.nano-highlight'))`)

  await wait(160)
  const storedClever = await storedNano2Document(browser, 'tiptap-clever-editor')
  assert(storedClever.blocks.some((block) => block.id === 'nano2-clever-emoji' && block.text === '🙂'))
  assert(storedClever.blocks.some((block) => block.id === 'nano2-clever-typography' && block.text === '→ ©'))
  const cleverHighlightBlock = storedClever.blocks.find((block) => block.id === 'nano2-clever-highlight')
  assert(cleverHighlightBlock)
  assert.equal(cleverHighlightBlock.text, 'bright')
  assert(cleverHighlightBlock.marks.some((mark) => mark.type === 'highlight' && cleverHighlightBlock.text.slice(mark.from, mark.to) === 'bright'))

  await storeNano2Document(browser, 'tiptap-forced-content-structure', {
    blocks: [{ id: 'bad-forced-root', type: 'paragraph', text: 'Invalid stored structure', marks: [] }],
  })
  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-forced-content-structure"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-forced-content-structure"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Forced Content Structure")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'forced'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading-1[data-id="nano2-forced-title"]')?.textContent.includes('Forced content structure')`)
  await waitForExpression(browser, `!document.querySelector('.nano2 [data-id="bad-forced-root"]')`)

  await setCursorAtBlockEndById(browser, 'nano2-forced-title')
  await pressKey(browser, '0', 'Digit0', 48, 10)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-heading-1[data-id="nano2-forced-title"]'))`)
  await waitForExpression(browser, `!document.querySelector('.nano2 .nano-paragraph[data-id="nano2-forced-title"]')`)

  await setCursorAtBlockEndById(browser, 'nano2-forced-body')
  await browser.send('Input.insertText', { text: ' edited' })
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-paragraph[data-id="nano2-forced-body"]')?.textContent === 'Body target edited'`)

  await wait(160)
  const storedForced = await storedNano2Document(browser, 'tiptap-forced-content-structure')
  assert.deepEqual(storedForced.blocks.map((block) => block.id), ['nano2-forced-title', 'nano2-forced-summary', 'nano2-forced-body'])
  assert(storedForced.blocks.some((block) => block.id === 'nano2-forced-title' && block.type === 'heading' && block.level === 1))
  assert(storedForced.blocks.some((block) => block.id === 'nano2-forced-body' && block.type === 'paragraph' && block.text === 'Body target edited'))
  assert(!storedForced.blocks.slice(1).some((block) => block.type === 'heading'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-images"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-images"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Images")')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-existing"] img')?.getAttribute('src') === '/favicon.svg'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-existing"] img')?.getAttribute('alt') === 'Nano Edit icon'`)

  await setCursorAtBlockEndById(browser, 'nano2-image-markdown-target')
  await pasteImageMarkdown(browser, '![Pasted image](https://cdn.example.com/nano.png "Pasted title")')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-markdown-target"] img')?.getAttribute('src') === 'https://cdn.example.com/nano.png'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-markdown-target"] img')?.getAttribute('alt') === 'Pasted image'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-markdown-target"] img')?.getAttribute('title') === 'Pasted title'`)

  await setCursorAtBlockEndById(browser, 'nano2-image-html-target')
  await pasteImageHtml(browser, '<img src="https://cdn.example.com/html.png" alt="HTML image" title="HTML title">')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-html-target"] img')?.getAttribute('src') === 'https://cdn.example.com/html.png'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-html-target"] img')?.getAttribute('alt') === 'HTML image'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-image[data-id="nano2-image-html-target"] img')?.getAttribute('title') === 'HTML title'`)

  await wait(160)
  const storedImages = await storedNano2Document(browser, 'tiptap-images')
  assert(storedImages.blocks.some((block) => block.id === 'nano2-image-existing' && block.type === 'image' && block.src === '/favicon.svg' && block.alt === 'Nano Edit icon' && block.title === 'Existing image'))
  assert(storedImages.blocks.some((block) => block.id === 'nano2-image-markdown-target' && block.type === 'image' && block.src === 'https://cdn.example.com/nano.png' && block.alt === 'Pasted image' && block.title === 'Pasted title'))
  assert(storedImages.blocks.some((block) => block.id === 'nano2-image-html-target' && block.type === 'image' && block.src === 'https://cdn.example.com/html.png' && block.alt === 'HTML image' && block.title === 'HTML title'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-long-texts"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-long-texts"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Long Texts")')
  await waitForExpression(browser, `document.querySelectorAll('.nano2 .nano-paragraph').length >= 260`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-paragraph[data-id="nano2-long-120"]')?.textContent.includes('nano2-120-800')`)
  await rememberLongTextNeighbors(browser)
  await setCursorAtBlockEndById(browser, 'nano2-long-120')
  await browser.send('Input.insertText', { text: ' PATCHED-LONG' })
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-paragraph[data-id="nano2-long-120"]')?.textContent.endsWith('PATCHED-LONG')`)
  assert.deepEqual(await longTextNeighborsStable(browser), { next: true, previous: true })

  await wait(160)
  const storedLongTexts = await storedNano2Document(browser, 'tiptap-long-texts')
  assert(storedLongTexts.blocks.length >= 261)
  assert(storedLongTexts.blocks.some((block) => block.id === 'nano2-long-120' && block.type === 'paragraph' && block.text.endsWith('PATCHED-LONG')))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-minimal-setup"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-minimal-setup"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Minimal Setup")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'minimal'`)
  await waitForExpression(browser, `!document.querySelector('.nano2-mention-suggestion')`)
  await waitForExpression(browser, `!document.querySelector('.nano2 .nano-heading')`)

  await setCursorAtBlockEndById(browser, 'nano2-minimal-target')
  await typeCharacters(browser, '# Plain')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-paragraph[data-id="nano2-minimal-target"]')?.textContent === '# Plain'`)
  await waitForExpression(browser, `!document.querySelector('.nano2 .nano-heading')`)
  await pressKey(browser, 'Enter', 'Enter', 13)
  await browser.send('Input.insertText', { text: 'Next' })
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-paragraph')).some((node) => node.textContent === 'Next')`)

  await wait(160)
  const storedMinimal = await storedNano2Document(browser, 'tiptap-minimal-setup')
  assert.deepEqual(storedMinimal.blocks.map((block) => block.type), ['paragraph', 'paragraph', 'paragraph'])
  assert(storedMinimal.blocks.every((block) => Array.isArray(block.marks) && block.marks.length === 0))
  assert(storedMinimal.blocks.some((block) => block.id === 'nano2-minimal-target' && block.text === '# Plain'))
  assert(storedMinimal.blocks.some((block) => block.text === 'Next'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-tables"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-tables"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Tables")')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector('nano2-table-main', 1, 1))})?.textContent === 'Open'`)

  await replaceTableCellText(browser, 'nano2-table-main', 1, 1, 'Closed')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector('nano2-table-main', 1, 1))})?.textContent === 'Closed'`)
  await pasteTableCells(browser, 'nano2-table-main', 1, 0, 'Gamma\tDone\nDelta\tNext')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector('nano2-table-main', 1, 0))})?.textContent === 'Gamma'`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector('nano2-table-main', 1, 1))})?.textContent === 'Done'`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector('nano2-table-main', 2, 0))})?.textContent === 'Delta'`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(tableCellSelector('nano2-table-main', 2, 1))})?.textContent === 'Next'`)

  await wait(160)
  const storedTables = await storedNano2Document(browser, 'tiptap-tables')
  assert(storedTables.blocks.some((block) =>
    block.id === 'nano2-table-main'
    && block.type === 'table'
    && JSON.stringify(block.rows) === JSON.stringify([
      ['Name', 'Status'],
      ['Gamma', 'Done'],
      ['Delta', 'Next'],
    ])
    && block.align?.[0] === 'left'
    && block.align?.[1] === 'center',
  ))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-markdown-shortcuts"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-markdown-shortcuts"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Markdown Shortcuts")')

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-heading')
  await typeCharacters(browser, '## Heading')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading[data-id="nano2-shortcut-heading"]')?.textContent.includes('Heading')`)

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-bullet')
  await typeCharacters(browser, '- Bullet')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-list-bullet[data-id="nano2-shortcut-bullet"]')?.textContent.includes('Bullet')`)

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-ordered')
  await typeCharacters(browser, '03) Ordered')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-list-ordered[data-id="nano2-shortcut-ordered"]')?.textContent.includes('Ordered')`)

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-quote')
  await typeCharacters(browser, '> Quote')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-quote[data-id="nano2-shortcut-quote"]')?.textContent.includes('Quote')`)

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-code')
  await typeCharacters(browser, '```ts const answer = 42')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-code[data-id="nano2-shortcut-code"]')?.textContent.includes('const answer = 42')`)

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-divider')
  await typeCharacters(browser, '--- ')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-divider[data-id="nano2-shortcut-divider"]'))`)

  await setCursorAtBlockEndById(browser, 'nano2-shortcut-inline')
  await typeCharacters(browser, '**bold** *em* ~~gone~~ `code`')
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-shortcut-inline"]')?.textContent === 'bold em gone code'`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-shortcut-inline"] strong'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-shortcut-inline"] em'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-shortcut-inline"] s'))`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-shortcut-inline"] code'))`)

  await wait(160)
  const storedShortcuts = await storedNano2Document(browser, 'tiptap-markdown-shortcuts')
  assert(storedShortcuts.blocks.some((block) => block.id === 'nano2-shortcut-heading' && block.type === 'heading' && block.level === 2 && block.text === 'Heading'))
  assert(storedShortcuts.blocks.some((block) => block.id === 'nano2-shortcut-bullet' && block.type === 'list_item' && block.kind === 'bullet' && block.text === 'Bullet'))
  assert(storedShortcuts.blocks.some((block) => block.id === 'nano2-shortcut-ordered' && block.type === 'list_item' && block.kind === 'ordered' && block.start === 3 && block.orderedMarker === ')' && block.orderedStartText === '03' && block.text === 'Ordered'))
  assert(storedShortcuts.blocks.some((block) => block.id === 'nano2-shortcut-quote' && block.type === 'quote' && block.text === 'Quote'))
  assert(storedShortcuts.blocks.some((block) => block.id === 'nano2-shortcut-code' && block.type === 'code' && block.language === 'ts' && block.text === 'const answer = 42'))
  assert(storedShortcuts.blocks.some((block) => block.id === 'nano2-shortcut-divider' && block.type === 'divider'))
  const inlineShortcutBlock = storedShortcuts.blocks.find((block) => block.id === 'nano2-shortcut-inline')
  assert(inlineShortcutBlock)
  assert.equal(inlineShortcutBlock.text, 'bold em gone code')
  assert(inlineShortcutBlock.marks.some((mark) => mark.type === 'bold' && inlineShortcutBlock.text.slice(mark.from, mark.to) === 'bold'))
  assert(inlineShortcutBlock.marks.some((mark) => mark.type === 'italic' && inlineShortcutBlock.text.slice(mark.from, mark.to) === 'em'))
  assert(inlineShortcutBlock.marks.some((mark) => mark.type === 'strike' && inlineShortcutBlock.text.slice(mark.from, mark.to) === 'gone'))
  assert(inlineShortcutBlock.marks.some((mark) => mark.type === 'code' && inlineShortcutBlock.text.slice(mark.from, mark.to) === 'code'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-tasks"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-tasks"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Tasks")')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(todoBoxSelector('nano2-task-unchecked'))})?.getAttribute('aria-checked') === 'false'`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(todoBoxSelector('nano2-task-checked'))})?.getAttribute('aria-checked') === 'true'`)

  await clickTarget(browser, todoBoxSelector('nano2-task-unchecked'))
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-todo[data-id="nano2-task-unchecked"]')?.dataset.checked === 'true'`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(todoBoxSelector('nano2-task-unchecked'))})?.getAttribute('aria-checked') === 'true'`)

  await focusTodoBoxById(browser, 'nano2-task-checked')
  await pressKey(browser, ' ', 'Space', 32)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-todo[data-id="nano2-task-checked"]')?.dataset.checked === 'false'`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(todoBoxSelector('nano2-task-checked'))})?.getAttribute('aria-checked') === 'false'`)

  await setCursorAtBlockEndById(browser, 'nano2-task-shortcut-open')
  await typeCharacters(browser, '[ ] Open task')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-todo[data-id="nano2-task-shortcut-open"]')?.textContent.includes('Open task')`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(todoBoxSelector('nano2-task-shortcut-open'))})?.getAttribute('aria-checked') === 'false'`)

  await setCursorAtBlockEndById(browser, 'nano2-task-shortcut-done')
  await typeCharacters(browser, '- [X] Done task')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-todo[data-id="nano2-task-shortcut-done"]')?.textContent.includes('Done task')`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(todoBoxSelector('nano2-task-shortcut-done'))})?.getAttribute('aria-checked') === 'true'`)

  await wait(160)
  const storedTasks = await storedNano2Document(browser, 'tiptap-tasks')
  assert(storedTasks.blocks.some((block) => block.id === 'nano2-task-unchecked' && block.type === 'todo' && block.checked === true && block.text === 'Ship unchecked task'))
  assert(storedTasks.blocks.some((block) => block.id === 'nano2-task-checked' && block.type === 'todo' && block.checked === false && block.text === 'Review checked task'))
  assert(storedTasks.blocks.some((block) => block.id === 'nano2-task-shortcut-open' && block.type === 'todo' && block.checked === false && block.text === 'Open task'))
  assert(storedTasks.blocks.some((block) => block.id === 'nano2-task-shortcut-done' && block.type === 'todo' && block.checked === true && block.checkedMarker === 'X' && block.text === 'Done task'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-menus"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-menus"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Menus")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'menus'`)

  await setSelectionInBlockById(browser, 'nano2-menus-selection', 0, 6)
  await waitForExpression(browser, `!document.querySelector('.nano2-bubble-menu')?.hidden`)
  await clickTarget(browser, '.nano2-bubble-menu .nano2-menu-button[data-command="bold"]')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 [data-id="nano2-menus-selection"] strong'))`)
  await waitForExpression(browser, `document.activeElement?.classList.contains('ProseMirror')`)

  await setCursorAtBlockEndById(browser, 'nano2-menus-floating')
  await waitForExpression(browser, `!document.querySelector('.nano2-floating-menu')?.hidden`)
  await clickTarget(browser, '.nano2-floating-menu .nano2-menu-button[data-command="heading1"]')
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading-1[data-id="nano2-menus-floating"]') !== null`)
  await browser.send('Input.insertText', { text: 'Menu heading' })
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading-1[data-id="nano2-menus-floating"]')?.textContent.includes('Menu heading')`)

  await wait(160)
  const storedMenus = await storedNano2Document(browser, 'tiptap-menus')
  const menuSelectionBlock = storedMenus.blocks.find((block) => block.id === 'nano2-menus-selection')
  assert(menuSelectionBlock)
  assert(menuSelectionBlock.marks.some((mark) => mark.type === 'bold' && menuSelectionBlock.text.slice(mark.from, mark.to) === 'Select'))
  assert(storedMenus.blocks.some((block) => block.id === 'nano2-menus-floating' && block.type === 'heading' && block.level === 1 && block.text === 'Menu heading'))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-mentions"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-mentions"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Mentions")')
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-mentions-existing"] .nano-mention-chip')?.textContent === '@Mina'`)

  await setCursorAtBlockEndById(browser, 'nano2-mentions-target')
  await browser.send('Input.insertText', { text: ' ' })
  await insertMention(browser, 'av', '@Avery')
  await waitForExpression(browser, `document.querySelector('.nano2 [data-id="nano2-mentions-target"] .nano-mention-chip[data-mention-id="avery"]')?.textContent === '@Avery'`)

  await wait(160)
  const storedMentions = await storedNano2Document(browser, 'tiptap-mentions')
  const existingMentionBlock = storedMentions.blocks.find((block) => block.id === 'nano2-mentions-existing')
  const targetMentionBlock = storedMentions.blocks.find((block) => block.id === 'nano2-mentions-target')
  assert(existingMentionBlock)
  assert(targetMentionBlock)
  assert(existingMentionBlock.marks.some((mark) => mark.type === 'mention' && mark.id === 'mina' && mark.label === 'Mina' && mark.to - mark.from === 1))
  assert(targetMentionBlock.marks.some((mark) => mark.type === 'mention' && mark.id === 'avery' && mark.label === 'Avery' && mark.to - mark.from === 1))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-slash-commands"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-slash-commands"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Slash Commands")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'slash'`)

  await runSlashCommand(browser, 'nano2-slash-heading', 'heading')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-heading-1[data-id="nano2-slash-heading"]'))`)
  await browser.send('Input.insertText', { text: 'Slash heading' })
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-heading-1[data-id="nano2-slash-heading"]')?.textContent.includes('Slash heading')`)

  await runSlashCommand(browser, 'nano2-slash-bullet', 'bullet')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-list-bullet[data-id="nano2-slash-bullet"]'))`)

  await runSlashCommand(browser, 'nano2-slash-quote', 'quote')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-quote[data-id="nano2-slash-quote"]'))`)

  await runSlashCommand(browser, 'nano2-slash-code', 'code')
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-code[data-id="nano2-slash-code"]'))`)

  await wait(160)
  const storedSlash = await storedNano2Document(browser, 'tiptap-slash-commands')
  assert(storedSlash.blocks.some((block) => block.id === 'nano2-slash-heading' && block.type === 'heading' && block.level === 1 && block.text === 'Slash heading'))
  assert(storedSlash.blocks.some((block) => block.id === 'nano2-slash-bullet' && block.type === 'list_item' && block.kind === 'bullet' && block.text === ''))
  assert(storedSlash.blocks.some((block) => block.id === 'nano2-slash-quote' && block.type === 'quote' && block.text === ''))
  assert(storedSlash.blocks.some((block) => block.id === 'nano2-slash-code' && block.type === 'code' && block.text === ''))

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-syntax-highlighting"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-syntax-highlighting"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Syntax Highlighting")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'syntax'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-code[data-id="nano2-syntax-code"] code')?.getAttribute('data-language') === 'typescript'`)
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2 .nano-code[data-id="nano2-syntax-code"] .hljs-keyword'))`)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-code[data-id="nano2-syntax-code"] .hljs-number')).some((node) => node.textContent === '42')`)

  await setCursorAtCodeBlockEndById(browser, 'nano2-syntax-code')
  assert.equal(await pasteIntoNano2Editor(browser, {
    'text/plain': '\nconst next = answer + 1',
  }), true)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano-code[data-id="nano2-syntax-code"]')?.textContent.includes('const next = answer + 1')`)
  await waitForExpression(browser, `Array.from(document.querySelectorAll('.nano2 .nano-code[data-id="nano2-syntax-code"] .hljs-keyword')).some((node) => node.textContent === 'const')`)

  await wait(160)
  const storedSyntax = await storedNano2Document(browser, 'tiptap-syntax-highlighting')
  const syntaxCodeBlock = storedSyntax.blocks.find((block) => block.id === 'nano2-syntax-code')
  assert(syntaxCodeBlock)
  assert.equal(syntaxCodeBlock.type, 'code')
  assert.equal(syntaxCodeBlock.language, 'typescript')
  assert(syntaxCodeBlock.text.endsWith('const next = answer + 1'))
  assert.equal('marks' in syntaxCodeBlock, false)

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-collaboration"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-collaboration"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Collaboration")')
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration')?.dataset.peers === 'peer-a,peer-b'`)
  await waitForExpression(browser, `document.querySelectorAll('.nano2-collaboration-peer').length === 2`)

  await setCursorAtPeerBlockEndById(browser, 'peer-a', 'nano2-collab-shared')
  await browser.send('Input.insertText', { text: ' from A' })
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration-peer[data-peer-id="peer-b"] [data-id="nano2-collab-shared"]')?.textContent.includes('from A')`)

  await setCursorAtPeerBlockEndById(browser, 'peer-b', 'nano2-collab-second')
  await browser.send('Input.insertText', { text: ' from B' })
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration-peer[data-peer-id="peer-a"] [data-id="nano2-collab-second"]')?.textContent.includes('from B')`)

  await clickTarget(browser, '.nano2-collaboration-join[data-action="join-peer"]')
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration')?.dataset.peers === 'peer-a,peer-b,peer-c'`)
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration-peer[data-peer-id="peer-c"] [data-id="nano2-collab-shared"]')?.textContent.includes('from A')`)
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration-peer[data-peer-id="peer-c"] [data-id="nano2-collab-second"]')?.textContent.includes('from B')`)

  await setCursorAtPeerBlockEndById(browser, 'peer-a', 'nano2-collab-shared')
  await browser.send('Input.insertText', { text: ' after C' })
  await waitForExpression(browser, `document.querySelector('.nano2-collaboration-peer[data-peer-id="peer-c"] [data-id="nano2-collab-shared"]')?.textContent.includes('after C')`)

  await clickTarget(browser, '.nano2-example-link[data-example-id="tiptap-drawing"]')
  await waitForExpression(browser, 'location.pathname === "/nano2/tiptap-drawing"')
  await waitForExpression(browser, 'document.querySelector(".nano2-example-title")?.textContent.includes("Tiptap Drawing")')
  await waitForExpression(browser, `document.querySelector('.nano2')?.dataset.profile === 'drawing'`)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano2-drawing-block[data-id="nano2-drawing-canvas"]')?.dataset.strokes === '1'`)
  await waitForExpression(browser, drawingCanvasHasInkExpression())

  await drawOnDrawingCanvas(browser)
  await waitForExpression(browser, `document.querySelector('.nano2 .nano2-drawing-block[data-id="nano2-drawing-canvas"]')?.dataset.strokes === '2'`)
  await wait(160)
  const storedDrawing = await storedNano2Document(browser, 'tiptap-drawing')
  const storedDrawingBlock = storedDrawing.blocks.find((block) => block.id === 'nano2-drawing-canvas')
  assert(storedDrawingBlock)
  assert.equal(storedDrawingBlock.type, 'nano2.drawing')
  assert.equal(storedDrawingBlock.data.strokes.length, 2)
  assert.equal('canvas' in storedDrawingBlock.data, false)

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

async function runSlashCommand(browser, blockId, query) {
  await setCursorAtBlockEndById(browser, blockId)
  await browser.send('Input.insertText', { text: '/' })
  await waitForExpression(browser, `Boolean(document.querySelector('.nano2-slash-command:not([hidden])'))`)
  await waitForExpression(browser, `document.activeElement?.classList.contains('nano2-slash-input')`)
  await typeCharacters(browser, query)
  await waitForExpression(browser, `document.querySelector('.nano2-slash-command:not([hidden])')?.textContent.toLowerCase().includes(${JSON.stringify(query)})`)
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, `!document.querySelector('.nano2-slash-command:not([hidden])')`)
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

async function pasteImageMarkdown(browser, markdown) {
  return pasteIntoNano2Editor(browser, {
    'text/markdown': markdown,
    'text/plain': markdown,
  })
}

async function pasteImageHtml(browser, html) {
  return pasteIntoNano2Editor(browser, {
    'text/html': html,
    'text/plain': '',
  })
}

async function replaceTableCellText(browser, tableId, row, column, text) {
  await focusTableCell(browser, tableId, row, column)
  return evaluate(browser, `(() => {
    const cell = document.querySelector(${JSON.stringify(tableCellSelector(tableId, row, column))})
    if (!(cell instanceof HTMLTableCellElement)) throw new Error('Missing nano2 table cell')

    cell.textContent = ${JSON.stringify(text)}
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: ${JSON.stringify(text)},
      inputType: 'insertText',
    })
    cell.dispatchEvent(event)
    return event.defaultPrevented
  })()`)
}

async function pasteTableCells(browser, tableId, row, column, text) {
  await focusTableCell(browser, tableId, row, column)
  return evaluate(browser, `(() => {
    const cell = document.querySelector(${JSON.stringify(tableCellSelector(tableId, row, column))})
    if (!(cell instanceof HTMLTableCellElement)) throw new Error('Missing nano2 table cell')

    const data = new DataTransfer()
    data.setData('text/plain', ${JSON.stringify(text)})
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: data,
    })
    cell.dispatchEvent(event)
    return event.defaultPrevented
  })()`)
}

async function focusTableCell(browser, tableId, row, column) {
  return evaluate(browser, `(() => {
    const cell = document.querySelector(${JSON.stringify(tableCellSelector(tableId, row, column))})
    if (!(cell instanceof HTMLTableCellElement)) throw new Error('Missing nano2 table cell')

    cell.focus()
    const range = document.createRange()
    range.selectNodeContents(cell)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    return document.activeElement === cell
  })()`)
}

async function pasteIntoNano2Editor(browser, dataByType) {
  return evaluate(browser, `(() => {
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!(editor instanceof HTMLElement)) throw new Error('Missing nano2 editor')

    const data = new DataTransfer()
    for (const [type, value] of Object.entries(${JSON.stringify(dataByType)})) {
      data.setData(type, value)
    }
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

async function setCursorAtBlockEndById(browser, id) {
  return evaluate(browser, `(() => {
    const target = document.querySelector(\`.nano2 .nano-block[data-id="${id}"]\`)
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!target || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 block id: ${id}')

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

async function setCursorAtCodeBlockEndById(browser, id) {
  return evaluate(browser, `(() => {
    const target = document.querySelector(\`.nano2 .nano-block[data-id="${id}"] code\`)
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!target || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 code block id: ${id}')

    editor.focus()
    const range = document.createRange()
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
    let lastText = null
    while (walker.nextNode()) lastText = walker.currentNode
    if (lastText instanceof Text) {
      range.setStart(lastText, lastText.data.length)
      range.collapse(true)
    } else {
      range.selectNodeContents(target)
      range.collapse(false)
    }
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    return true
  })()`)
}

async function setCursorAtPeerBlockEndById(browser, peerId, blockId) {
  return evaluate(browser, `(() => {
    const target = document.querySelector(\`.nano2-collaboration-peer[data-peer-id="${peerId}"] .nano-block[data-id="${blockId}"]\`)
    const editor = document.querySelector(\`.nano2-collaboration-peer[data-peer-id="${peerId}"] .ProseMirror\`)
    if (!target || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 collaboration block: ${peerId}/${blockId}')

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

async function rememberLongTextNeighbors(browser) {
  return evaluate(browser, `(() => {
    window.__nano2LongTextNeighbors = {
      previous: document.querySelector('.nano2 .nano-paragraph[data-id="nano2-long-119"]'),
      next: document.querySelector('.nano2 .nano-paragraph[data-id="nano2-long-121"]'),
    }
    return Boolean(window.__nano2LongTextNeighbors.previous && window.__nano2LongTextNeighbors.next)
  })()`)
}

async function longTextNeighborsStable(browser) {
  return evaluate(browser, `(() => ({
    previous: window.__nano2LongTextNeighbors?.previous === document.querySelector('.nano2 .nano-paragraph[data-id="nano2-long-119"]'),
    next: window.__nano2LongTextNeighbors?.next === document.querySelector('.nano2 .nano-paragraph[data-id="nano2-long-121"]'),
  }))()`)
}

async function setSelectionInBlockById(browser, id, fromOffset, toOffset) {
  return evaluate(browser, `(() => {
    const target = document.querySelector(\`.nano2 .nano-block[data-id="${id}"]\`)
    const editor = document.querySelector(${JSON.stringify(prosemirrorSelector)})
    if (!target || !(editor instanceof HTMLElement)) throw new Error('Missing nano2 block id: ${id}')

    const text = target.firstChild
    if (!(text instanceof Text)) throw new Error('Missing text node for nano2 block id: ${id}')

    editor.focus()
    const range = document.createRange()
    range.setStart(text, ${fromOffset})
    range.setEnd(text, ${toOffset})
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
    return true
  })()`)
}

async function focusTodoBoxById(browser, id) {
  const selector = todoBoxSelector(id)
  return evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!(target instanceof HTMLElement)) throw new Error('Missing nano2 todo checkbox id: ${id}')
    target.focus()
    return document.activeElement === target
  })()`)
}

async function typeCharacters(browser, text) {
  for (const character of text) {
    await browser.send('Input.insertText', { text: character })
  }
}

async function storedNano2Document(browser, exampleId) {
  const storageKey = nano2ExampleStorageKey(exampleId)
  return evaluate(browser, storedPersistenceValueExpression(storageKey))
}

async function storeNano2Document(browser, exampleId, document) {
  const storageKey = nano2ExampleStorageKey(exampleId)
  const payload = persistenceSnapshotText(document)
  return evaluate(browser, `localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(payload)})`)
}

async function nano2ExampleHref(browser, exampleId) {
  return evaluate(browser, `new URL(document.querySelector(\`.nano2-example-link[data-example-id="${exampleId}"]\`)?.href ?? '', location.href).pathname`)
}

function drawingCanvasHasInkExpression() {
  return `(() => {
    const canvas = document.querySelector('.nano2 .nano2-drawing-block[data-id="nano2-drawing-canvas"] canvas')
    if (!(canvas instanceof HTMLCanvasElement)) return false
    const context = canvas.getContext('2d')
    if (!context) return false
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) return true
    }
    return false
  })()`
}

async function drawOnDrawingCanvas(browser) {
  const box = await evaluate(browser, `(() => {
    const canvas = document.querySelector('.nano2 .nano2-drawing-block[data-id="nano2-drawing-canvas"] canvas')
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing nano2 drawing canvas')
    const rect = canvas.getBoundingClientRect()
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
  })()`)
  const points = [
    [box.left + box.width * 0.18, box.top + box.height * 0.62],
    [box.left + box.width * 0.42, box.top + box.height * 0.36],
    [box.left + box.width * 0.72, box.top + box.height * 0.58],
  ]
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: points[0][0], y: points[0][1] })
  await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: points[0][0], y: points[0][1], button: 'left', clickCount: 1 })
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: points[1][0], y: points[1][1], button: 'left', buttons: 1 })
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: points[2][0], y: points[2][1], button: 'left', buttons: 1 })
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: points[2][0], y: points[2][1], button: 'left', clickCount: 1 })
}

function todoBoxSelector(id) {
  return `.nano2 .nano-todo[data-id="${id}"] .nano-todo-box`
}

function tableCellSelector(tableId, row, column) {
  return `.nano2 .nano-table[data-id="${tableId}"] [data-row="${row}"][data-column="${column}"]`
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
