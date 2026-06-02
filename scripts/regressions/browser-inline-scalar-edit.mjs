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
  await mountScalarEdit(browser)

  assert.equal(await text(browser), 'Hello')
  assert.equal(await activeElementId(browser), 'scalar-editor')
  assert.equal(await evaluate(browser, 'window.__scalar.editor.dataset.nanoInlineEdit'), 'true')

  await appendText(browser, editorSelector, 'X')
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "HelloX"')
  assert((await events(browser)).some((event) => event.startsWith('draft:HelloX:')))

  await pressKey(browser, 'Backspace', 'Backspace', 8)
  await waitForExpression(browser, 'window.__scalar.editor.textContent === "Hello"')
  assert.equal((await events(browser)).some((event) => event.startsWith('commit:')), false)

  await pasteText(browser, editorSelector, ' multi\nline')
  await waitForExpression(browser, 'window.__scalar.editor.textContent.includes("multi line")')
  assert.equal((await text(browser)).includes('\n'), false)

  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, 'window.__scalar.events.includes("history:undo:Hello multi line")')
  assert.equal(await text(browser), 'Hello multi line')

  await evaluate(browser, 'window.__scalar.handle.focus({ kind: "end" })')
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, 'window.__scalar.events.includes("commit:Hello multi line")')
  assert.equal(await activeElementId(browser), 'scalar-host')

  await evaluate(browser, 'window.__scalar.handle.focus({ kind: "end" })')
  await appendText(browser, editorSelector, ' draft')
  await pressKey(browser, 'Escape', 'Escape', 27)
  await waitForExpression(browser, 'window.__scalar.events.includes("cancel:Hello")')
  assert.equal(await text(browser), 'Hello')
  assert.equal(await activeElementId(browser), 'scalar-host')

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

  const eventCountBeforeDestroy = await evaluate(browser, 'window.__scalar.events.length')
  await evaluate(browser, 'window.__scalar.handle.destroy()')
  assert.equal(await evaluate(browser, 'window.__scalar.editor.hasAttribute("contenteditable")'), false)
  assert.equal(await evaluate(browser, 'window.__scalar.editor.dataset.nanoInlineEdit'), undefined)

  await pasteText(browser, editorSelector, 'after destroy')
  await pressKey(browser, 'Enter', 'Enter', 13)
  assert.equal(await evaluate(browser, 'window.__scalar.events.length'), eventCountBeforeDestroy)

  console.log('ok browser inline scalar edit')
})

async function mountScalarEdit(browser) {
  await evaluate(browser, `async () => {
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
    const handle = createContenteditableScalarEdit({
      ariaLabel: 'Scalar editor',
      element: editor,
      initialSelection: { kind: 'end' },
      initialText: 'Hello',
      lineBreak: 'single-line',
      onDraftChange: (snapshot) => events.push(\`draft:\${snapshot.text}:\${snapshot.offset}\`),
      onHistoryIntent: (intent) => events.push(\`history:\${intent.direction}:\${intent.text}\`),
      onCommit: (commit) => events.push(\`commit:\${commit.text}\`),
      onCancel: (cancel) => events.push(\`cancel:\${cancel.text}\`),
      restoreHostFocus: () => {
        events.push('restore-host')
        host.focus()
      },
    })
    window.__scalar = { editor, events, handle, host }
    return true
  }`, (expression) => `(${expression})()`)
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

async function activeElementId(browser) {
  return evaluate(browser, 'document.activeElement?.id ?? ""')
}
