import assert from 'node:assert/strict'
import {
  evaluate,
  pressKey,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'
import { appendText, pasteText } from './browser-local-edit-actions.mjs'

const modifier = process.platform === 'darwin' ? 4 : 2
const editorSelector = '[data-scalar-editor="true"]'

await withBrowserRegression('nano-edit-inline-scalar-edit-chrome-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 900,
    height: 520,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')

  await mountScalarEdit(browser, {
    decorations: [
      { from: 1, to: 3, className: 'formula-ref-0', data: { token: 'B2' } },
      { from: 4, to: 6, className: 'formula-ref-1', data: { token: 'C3' } },
    ],
  }, { customHistory: false, initialText: '=B2+C3' })
  assert.equal(await text(browser), '=B2+C3')
  assert.equal(await evaluate(browser, 'window.__scalar.handle.snapshot().text'), '=B2+C3')
  assert.equal(await selectionOffset(browser), 6)
  assert.deepEqual(await decorationSpans(browser), [
    { className: 'formula-ref-0', text: 'B2', token: 'B2' },
    { className: 'formula-ref-1', text: 'C3', token: 'C3' },
  ])

  await evaluate(browser, `(() => {
    window.__scalar.handle.focus({ kind: 'offset', offset: 3 })
    window.__scalar.handle.setDecorations([
      { from: 4, to: 6, className: 'formula-ref-2', data: { token: 'C3' } },
    ])
    return true
  })()`)
  assert.equal(await selectionOffset(browser), 3)
  assert.deepEqual(await decorationSpans(browser), [
    { className: 'formula-ref-2', text: 'C3', token: 'C3' },
  ])

  await evaluate(browser, 'window.__scalar.handle.focus({ kind: "end" })')
  await appendText(browser, editorSelector, '+A1')
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "=B2+C3+A1"')
  assert.equal(await evaluate(browser, 'window.__scalar.handle.snapshot().text'), '=B2+C3+A1')
  await evaluate(browser, `(() => {
    window.__scalar.handle.setDecorations([
      { from: 1, to: 3, className: 'formula-ref-0', data: { token: 'B2' } },
      { from: 4, to: 6, className: 'formula-ref-1', data: { token: 'C3' } },
      { from: 7, to: 9, className: 'formula-ref-2', data: { token: 'A1' } },
    ])
    return true
  })()`)
  assert.deepEqual(await decorationSpans(browser), [
    { className: 'formula-ref-0', text: 'B2', token: 'B2' },
    { className: 'formula-ref-1', text: 'C3', token: 'C3' },
    { className: 'formula-ref-2', text: 'A1', token: 'A1' },
  ])

  await evaluate(browser, 'window.__scalar.handle.replaceText(1, 3, "D4")')
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "=D4+C3+A1"')
  await evaluate(browser, `(() => {
    window.__scalar.handle.setDecorations([
      { from: 1, to: 3, className: 'formula-ref-3', data: { token: 'D4' } },
    ])
    window.__scalar.handle.focus({ kind: 'end' })
    window.__scalar.handle.insertText('+Z9')
    return true
  })()`)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "=D4+C3+A1+Z9"')
  await evaluate(browser, `(() => {
    window.__scalar.handle.setDecorations([
      { from: 1, to: 3, className: 'formula-ref-3', data: { token: 'D4' } },
      { from: 10, to: 12, className: 'formula-ref-4', data: { token: 'Z9' } },
    ])
    return true
  })()`)
  assert.deepEqual(await decorationSpans(browser), [
    { className: 'formula-ref-3', text: 'D4', token: 'D4' },
    { className: 'formula-ref-4', text: 'Z9', token: 'Z9' },
  ])
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, 'window.__scalar.events.includes("commit:=D4+C3+A1+Z9:enter")')
  await evaluate(browser, 'window.__scalar.handle.destroy()')

  await mountScalarEdit(browser, {
    decorations: [
      { from: 5, to: 9, className: 'mention-token', atomic: true, data: { token: '@Ren' } },
    ],
  }, { customHistory: false, initialText: 'Ping @Ren now' })
  assert.equal(await atomicDecorationCount(browser), 1)
  await evaluate(browser, 'window.__scalar.handle.focus({ kind: "offset", offset: 9 })')
  await pressKey(browser, 'Backspace', 'Backspace', 8)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Ping  now"')
  assert.equal(await evaluate(browser, 'window.__scalar.handle.snapshot().text'), 'Ping  now')
  assert((await events(browser)).some((event) => event.startsWith('draft:Ping  now:')))
  await evaluate(browser, 'window.__scalar.handle.destroy()')

  await mountScalarEdit(browser, {
    blur: 'commit',
    containTextEditingKeys: true,
    history: 'local',
  }, { customHistory: false })

  assert.equal(await text(browser), 'Hello')
  assert.equal(await activeElementId(browser), 'scalar-editor')
  assert.equal(await evaluate(browser, 'window.__scalar.editor.dataset.nanoInlineEdit'), 'true')

  await appendText(browser, editorSelector, 'X')
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "HelloX"')
  assert((await events(browser)).some((event) => event.startsWith('draft:HelloX:')))

  await pressKey(browser, 'Backspace', 'Backspace', 8)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Hello"')
  assert.equal((await events(browser)).includes('parent:Backspace'), false)
  assert.equal((await events(browser)).some((event) => event.startsWith('commit:')), false)

  await pasteText(browser, editorSelector, ' multi\nline')
  await waitForExpression(browser, 'window.__scalar.editor.textContent.includes("multi line")')
  assert.equal((await text(browser)).includes('\n'), false)

  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Hello"')
  await pressKey(browser, 'y', 'KeyY', 89, modifier)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Hello multi line"')

  const draftCountBeforeExternalSync = await eventCount(browser, 'draft:')
  await evaluate(browser, `(() => {
    window.__scalar.handle.setText('=B2', { kind: 'end' })
    return true
  })()`)
  assert.equal(await text(browser), '=B2')
  assert.equal(await eventCount(browser, 'draft:'), draftCountBeforeExternalSync)

  await evaluate(browser, `(() => {
    window.__scalar.handle.setText('=C3', { kind: 'offset', offset: 2 }, { notify: true, history: true })
    return true
  })()`)
  await waitForExpression(browser, 'window.__scalar.events.includes("draft:=C3:2")')
  assert.equal(await selectionOffset(browser), 2)

  await evaluate(browser, 'window.__scalar.host.focus()')
  await waitForExpression(browser, 'window.__scalar.events.includes("commit:=C3:blur")')
  const commitCountAfterBlur = await eventCount(browser, 'commit:')
  await evaluate(browser, 'window.__scalar.handle.focus({ kind: "end" })')
  await pressKey(browser, 'Enter', 'Enter', 13)
  assert.equal(await eventCount(browser, 'commit:'), commitCountAfterBlur)

  await evaluate(browser, 'window.__scalar.handle.destroy()')

  await mountScalarEdit(browser, {
    history: 'local',
  }, { customHistory: true })
  await appendText(browser, editorSelector, 'X')
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "HelloX"')
  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, 'window.__scalar.events.includes("history:undo:HelloX")')
  assert.equal(await text(browser), 'HelloX')
  await evaluate(browser, 'window.__scalar.handle.destroy()')

  await mountScalarEdit(browser, { blur: 'none' })
  await appendText(browser, editorSelector, ' draft')
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Hello draft"')
  await pressKey(browser, 'Escape', 'Escape', 27)
  await waitForExpression(browser, 'window.__scalar.events.includes("cancel:Hello:escape")')
  assert.equal(await text(browser), 'Hello')
  assert.equal(await activeElementId(browser), 'scalar-host')

  await evaluate(browser, 'window.__scalar.handle.destroy()')
  await mountScalarEdit(browser)
  const commitCountBeforeComposition = await eventCount(browser, 'commit:')
  await evaluate(browser, `(() => {
    window.__scalar.handle.focus({ kind: 'end' })
    window.__scalar.editor.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    return true
  })()`)
  await pressKey(browser, 'Enter', 'Enter', 13)
  assert.equal(await eventCount(browser, 'commit:'), commitCountBeforeComposition)
  await evaluate(browser, `(() => {
    window.__scalar.editor.textContent = 'Hello 조합'
    window.__scalar.editor.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '조합' }))
    return true
  })()`)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Hello 조합"')

  const scalarCallbackCountBeforeDestroy = await scalarCallbackCount(browser)
  await evaluate(browser, 'window.__scalar.handle.destroy()')
  assert.equal(await evaluate(browser, 'window.__scalar.editor.hasAttribute("contenteditable")'), false)
  assert.equal(await evaluate(browser, 'window.__scalar.editor.dataset.nanoInlineEdit'), undefined)

  await pasteText(browser, editorSelector, 'after destroy')
  await pressKey(browser, 'Enter', 'Enter', 13)
  assert.equal(await scalarCallbackCount(browser), scalarCallbackCountBeforeDestroy)

  console.log('ok browser inline scalar edit')
})

async function mountScalarEdit(browser, scalarOptions = {}, harnessOptions = {}) {
  await evaluate(browser, `async (scalarOptions, harnessOptions) => {
    const { createContenteditableScalarEdit } = await import('/src/inline-edit/index.ts')
    document.body.replaceChildren()
    const host = document.createElement('button')
    host.id = 'scalar-host'
    host.textContent = 'host focus'
    const editor = document.createElement('div')
    editor.id = 'scalar-editor'
    editor.dataset.scalarEditor = 'true'
    editor.style.cssText = 'min-height: 28px; border: 1px solid #999; padding: 4px;'
    document.body.append(host, editor)
    const events = []
    document.body.addEventListener('keydown', (event) => {
      events.push(\`parent:\${event.key}\`)
    })
    const editOptions = {
      ariaLabel: 'Scalar editor',
      element: editor,
      ...scalarOptions,
      initialSelection: { kind: 'end' },
      initialText: harnessOptions.initialText ?? 'Hello',
      lineBreak: 'single-line',
      onDraftChange: (snapshot) => events.push(\`draft:\${snapshot.text}:\${snapshot.offset}\`),
      onCommit: (commit) => events.push(\`commit:\${commit.text}:\${commit.reason}\`),
      onCancel: (cancel) => events.push(\`cancel:\${cancel.text}:\${cancel.reason}\`),
      restoreHostFocus: () => {
        events.push('restore-host')
        host.focus()
      },
    }
    if (harnessOptions.customHistory ?? true) {
      editOptions.onHistoryIntent = (intent) => events.push(\`history:\${intent.direction}:\${intent.text}\`)
    }
    const handle = createContenteditableScalarEdit(editOptions)
    window.__scalar = { editor, events, handle, host }
    return true
  }`, (expression) => `(${expression})(${JSON.stringify(scalarOptions)}, ${JSON.stringify(harnessOptions)})`)
}

async function text(browser) {
  return evaluate(browser, 'window.__scalar.editor.textContent')
}

async function events(browser) {
  return evaluate(browser, 'window.__scalar.events')
}

async function eventCount(browser, prefix) {
  return evaluate(browser, `window.__scalar.events.filter((event) => event.startsWith(${JSON.stringify(prefix)})).length`)
}

async function decorationSpans(browser) {
  return evaluate(browser, `[...window.__scalar.editor.querySelectorAll('[data-nano-inline-decoration="true"]')]
    .map((element) => ({
      className: element.className,
      text: element.textContent,
      token: element.getAttribute('data-token'),
    }))`)
}

async function atomicDecorationCount(browser) {
  return evaluate(browser, `window.__scalar.editor.querySelectorAll('[data-nano-inline-atomic="true"]').length`)
}

async function scalarCallbackCount(browser) {
  return evaluate(browser, `window.__scalar.events.filter((event) => (
    event.startsWith('draft:')
    || event.startsWith('history:')
    || event.startsWith('commit:')
    || event.startsWith('cancel:')
  )).length`)
}

async function selectionOffset(browser) {
  return evaluate(browser, 'window.__scalar.handle.snapshot().offset')
}

async function activeElementId(browser) {
  return evaluate(browser, 'document.activeElement?.id ?? ""')
}
