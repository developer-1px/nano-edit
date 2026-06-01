import assert from 'node:assert/strict'
import {
  clickTarget,
  evaluate,
  pressKey,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'
import { appendText, pasteText } from './browser-local-edit-actions.mjs'

const editorSelector = '.inline-edit-demo-editor'
const suggestionSelector = '.inline-edit-demo-suggestion:not([hidden])'
const modifier = process.platform === 'darwin' ? 4 : 2

await withBrowserRegression('nano-edit-inline-edit-demo-chrome-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1120,
    height: 760,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await waitForExpression(browser, 'Boolean(document.querySelector(".demo-document-button[data-document-id=\\"inline-edit\\"]"))')
  await clickTarget(browser, '.demo-document-button[data-document-id="inline-edit"]')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(editorSelector)}))`)

  assert.equal(await textContent(browser, editorSelector), 'Draft release note with @Mina and /summary')

  await appendText(browser, editorSelector, '@')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(suggestionSelector)}))`)
  await waitForExpression(browser, 'document.activeElement?.classList.contains("inline-edit-demo-suggestion-input")')
  await pressKey(browser, 'ArrowDown', 'ArrowDown', 40)
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(editorSelector)})?.textContent.includes('@Jules')`)

  await clickTarget(browser, '.inline-edit-demo-button[data-inline-edit-trigger="slash-command"]')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(suggestionSelector)}))`)
  await waitForExpression(browser, 'document.activeElement?.classList.contains("inline-edit-demo-suggestion-input")')
  await pressKey(browser, 'ArrowDown', 'ArrowDown', 40)
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(editorSelector)})?.textContent.includes('/checklist')`)

  await pasteText(browser, editorSelector, 'multi\nline')
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(editorSelector)})?.textContent.includes('multi line')`)
  assert.equal((await textContent(browser, editorSelector)).includes('\n'), false)

  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, `!document.querySelector(${JSON.stringify(editorSelector)})?.textContent.includes('multi line')`)

  console.log('ok browser inline edit demo')
})

async function textContent(browser, selector) {
  return evaluate(browser, `document.querySelector(${JSON.stringify(selector)})?.textContent ?? ''`)
}
