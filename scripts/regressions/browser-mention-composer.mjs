import assert from 'node:assert/strict'
import {
  clickTarget,
  evaluate,
  pressKey,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'
import { appendText } from './browser-local-edit-actions.mjs'

const editorSelector = '.mention-composer-demo-editor'
const suggestionSelector = '.mention-composer-demo-suggestion:not([hidden])'

await withBrowserRegression('nano-edit-mention-composer-chrome-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1120,
    height: 760,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await waitForExpression(browser, 'Boolean(document.querySelector(".demo-document-button[data-document-id=\\"mention-composer\\"]"))')
  await clickTarget(browser, '.demo-document-button[data-document-id="mention-composer"]')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(editorSelector)}))`)

  // allowSpaces: a "[[" wiki-link trigger keeps a multi-word query alive, so
  // typing a space-containing title still filters the suggestion list.
  await appendText(browser, editorSelector, ' [[Release Pl')
  await waitForExpression(browser, `Boolean(document.querySelector(${JSON.stringify(suggestionSelector)}))`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(suggestionSelector)})?.textContent.includes('Release Plan Q3')`)

  // Enter inserts the paired "[[...]]" form (insertText + "]]" suffix).
  await waitForExpression(browser, 'document.activeElement?.classList.contains("mention-composer-demo-suggestion-input")')
  await pressKey(browser, 'Enter', 'Enter', 13)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(editorSelector)})?.textContent.includes('[[Release Plan Q3]]')`)

  assert.equal((await textContent(browser, editorSelector)).includes('[[Release Plan Q3]]'), true)

  console.log('ok browser mention composer')
})

async function textContent(browser, selector) {
  return evaluate(browser, `document.querySelector(${JSON.stringify(selector)})?.textContent ?? ''`)
}
