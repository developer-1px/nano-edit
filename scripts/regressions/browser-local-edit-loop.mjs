import assert from 'node:assert/strict'
import {
  clickTarget,
  demoStorageKey,
  evaluate,
  pressKey,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'
import {
  appendText,
  blurEditor,
  composeText,
  pasteText,
} from './browser-local-edit-actions.mjs'

const storageKey = demoStorageKey()
const localEditText = ' Local Edit Loop 확인'
const tableEditText = ' / local edit'
const compositionEditText = ' 조합 입력'
const multilinePasteText = ' 붙여\n넣기'
const normalizedPasteText = ' 붙여 넣기'
const modifier = process.platform === 'darwin' ? 4 : 2

await withBrowserRegression('nano-edit-local-edit-chrome-', async ({ browser, url }) => {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await runLocalEditLoop(browser, url)
  console.log('ok browser local edit loop')
})

async function runLocalEditLoop(browser, url) {
  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await evaluate(browser, `(() => {
    localStorage.removeItem(${JSON.stringify(storageKey)});
    return true
  })()`)
  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, 'Boolean(document.querySelector(".nano-block[data-id]"))')

  const targets = await resolveLocalEditTargets(browser)
  assertResolvedTargets(targets)
  const initial = await documentSnapshot(browser, targets)
  assert.equal(initial.title, 'Nano Edit')
  assertQuietSurface(initial)
  assert.equal(initial.hasSelfDescription, true)
  assert.equal(initial.hasTableCell, true)

  await appendText(browser, blockSelector(targets.textBlockId), localEditText)
  await waitForExpression(browser, domTextIncludesExpression(blockSelector(targets.textBlockId), localEditText))
  await waitForExpression(browser, storedTextIncludesExpression(targets.textBlockId, localEditText))

  await clickTarget(browser, `${blockSelector(targets.todoBlockId)} .nano-todo-box`)
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(`${blockSelector(targets.todoBlockId)} .nano-todo-box`)})?.getAttribute('aria-checked') === 'true'`)
  await waitForExpression(browser, storedTodoCheckedExpression(targets.todoBlockId, true))

  await appendText(browser, tableCellSelector(targets), tableEditText)
  await waitForExpression(browser, domTextIncludesExpression(tableCellSelector(targets), tableEditText))
  await waitForExpression(browser, storedTableCellIncludesExpression(targets, tableEditText))
  await waitForExpression(browser, focusedElementExpression(tableCellSelector(targets)))
  await waitForExpression(browser, activeBlockExpression(targets.tableBlockId))
  assertQuietSurface(await documentSnapshot(browser, targets))

  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, `!(${domTextIncludesExpression(tableCellSelector(targets), tableEditText)})`)
  await waitForExpression(browser, `!(${storedTableCellIncludesExpression(targets, tableEditText)})`)
  await waitForExpression(browser, domTextIncludesExpression(blockSelector(targets.textBlockId), localEditText))
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(`${blockSelector(targets.todoBlockId)} .nano-todo-box`)})?.getAttribute('aria-checked') === 'true'`)
  await waitForExpression(browser, storedTextIncludesExpression(targets.textBlockId, localEditText))
  await waitForExpression(browser, storedTodoCheckedExpression(targets.todoBlockId, true))

  await evaluate(browser, `(() => {
    const editor = document.querySelector('.ProseMirror')
    if (editor instanceof HTMLElement) editor.focus()
    return true
  })()`)
  await pressKey(browser, 'y', 'KeyY', 89, modifier)
  await waitForExpression(browser, domTextIncludesExpression(tableCellSelector(targets), tableEditText))
  await waitForExpression(browser, storedTableCellIncludesExpression(targets, tableEditText))

  await composeText(browser, tableCellSelector(targets), compositionEditText)
  await waitForExpression(browser, domTextIncludesExpression(tableCellSelector(targets), compositionEditText))
  await waitForExpression(browser, storedTableCellIncludesExpression(targets, compositionEditText))

  await pasteText(browser, tableCellSelector(targets), multilinePasteText)
  await waitForExpression(browser, domTextIncludesExpression(tableCellSelector(targets), normalizedPasteText))
  await waitForExpression(browser, storedTableCellIncludesExpression(targets, normalizedPasteText))
  await waitForExpression(browser, `!(${storedTableCellIncludesExpression(targets, '\n')})`)

  await blurEditor(browser)
  assertQuietSurface(await documentSnapshot(browser, targets))

  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, `document.querySelector(${JSON.stringify(blockSelector(targets.textBlockId))})?.textContent.includes(${JSON.stringify(localEditText)})`)
  const restored = await documentSnapshot(browser, targets)
  assert.equal(restored.todoChecked, true)
  assert.equal(restored.tableCell.includes(tableEditText), true)
  assert.equal(restored.tableCell.includes(compositionEditText), true)
  assert.equal(restored.tableCell.includes(normalizedPasteText), true)
  assertQuietSurface(restored)
}

async function resolveLocalEditTargets(browser) {
  return evaluate(browser, `(() => {
    const title = document.querySelector('.nano-heading-1[data-id] .nano-block-content')
    const textBlock = blockContaining('.nano-paragraph[data-id]', 'AI가 만든 Markdown 문서')
    const todoBlock = blockContaining('.nano-todo[data-id]', '필요한 문장만 조용히 고친다')
    const tableBlock = blockContaining('.nano-table[data-id]', 'cursor 주변 affordance')
    const tableCell = [...tableBlock.querySelectorAll('th[data-row][data-column], td[data-row][data-column]')]
      .find((cell) => cell.textContent?.includes('cursor 주변 affordance'))

    if (!(title instanceof HTMLElement)) throw new Error('Missing self-describing title')
    if (!(textBlock instanceof HTMLElement)) throw new Error('Missing editable paragraph target')
    if (!(todoBlock instanceof HTMLElement)) throw new Error('Missing editable todo target')
    if (!(tableBlock instanceof HTMLElement)) throw new Error('Missing editable table target')
    if (!(tableCell instanceof HTMLElement)) throw new Error('Missing editable table cell target')

    return {
      tableBlockId: tableBlock.dataset.id,
      tableColumn: tableCell.dataset.column,
      tableEditable: tableCell.dataset.editable,
      tableRow: tableCell.dataset.row,
      textBlockId: textBlock.dataset.id,
      titleBlockId: title.closest('.nano-block[data-id]')?.dataset.id,
      titleText: title.textContent?.trim() ?? '',
      todoBlockId: todoBlock.dataset.id,
    }

    function blockContaining(selector, text) {
      return [...document.querySelectorAll(selector)]
        .find((element) => element.textContent?.includes(text))
    }
  })()`)
}

async function documentSnapshot(browser, targets) {
  return evaluate(browser, `(() => {
    return {
      title: document.querySelector(${JSON.stringify(`${blockSelector(targets.titleBlockId)} .nano-block-content`)})?.textContent?.trim() ?? '',
      hasSelfDescription: Boolean(document.body.textContent?.includes('AI가 만든 Markdown 문서')),
      hasTableCell: Boolean(document.querySelector(${JSON.stringify(tableCellSelector(targets))})),
      tableCell: document.querySelector(${JSON.stringify(tableCellSelector(targets))})
        ?.textContent ?? '',
      todoChecked: document.querySelector(${JSON.stringify(`${blockSelector(targets.todoBlockId)} .nano-todo-box`)})?.getAttribute('aria-checked') === 'true',
      visibleCommandPalettes: visibleCount('.nano-command-palette:not([hidden])'),
      visibleInspectorPanels: visibleCount('.inspector:not([hidden])'),
      visibleSourceEditors: visibleCount('textarea.nano-markdown-block'),
      visibleSourceWidgets: visibleCount('.nano-source-widget'),
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

function assertQuietSurface(snapshot) {
  assert.equal(snapshot.visibleSourceWidgets, 0)
  assert.equal(snapshot.visibleSourceEditors, 0)
  assert.equal(snapshot.visibleCommandPalettes, 0)
  assert.equal(snapshot.visibleInspectorPanels, 0)
}

function assertResolvedTargets(targets) {
  for (const [key, value] of Object.entries(targets)) {
    assert.equal(typeof value, 'string', `resolved target ${key} must be a string`)
    assert.notEqual(value, '', `resolved target ${key} must be non-empty`)
  }
  assert.equal(targets.tableEditable, 'true', 'local edit loop target table cell must be plain-editable')
}

function storedTextIncludesExpression(blockId, text) {
  return `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || 'null')?.blocks?.find((block) => block.id === ${JSON.stringify(blockId)})?.text?.includes(${JSON.stringify(text)}) === true`
}

function storedTodoCheckedExpression(blockId, checked) {
  return `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || 'null')?.blocks?.find((block) => block.id === ${JSON.stringify(blockId)})?.checked === ${checked}`
}

function storedTableCellIncludesExpression(targets, text) {
  return `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || 'null')?.blocks?.find((block) => block.id === ${JSON.stringify(targets.tableBlockId)})?.rows?.[${Number(targets.tableRow)}]?.[${Number(targets.tableColumn)}]?.includes(${JSON.stringify(text)}) === true`
}

function domTextIncludesExpression(selector, text) {
  return `document.querySelector(${JSON.stringify(selector)})?.textContent.includes(${JSON.stringify(text)}) === true`
}

function focusedElementExpression(selector) {
  return `document.activeElement === document.querySelector(${JSON.stringify(selector)})`
}

function activeBlockExpression(blockId) {
  return `(() => {
    const activeBlocks = [...document.querySelectorAll('.nano-block.nano-block-active')]
    return activeBlocks.length === 1 && activeBlocks[0]?.dataset.id === ${JSON.stringify(blockId)}
  })()`
}

function blockSelector(id) {
  return `.nano-block[data-id="${cssAttributeValue(id)}"]`
}

function tableCellSelector(targets) {
  return `${blockSelector(targets.tableBlockId)} [data-row="${cssAttributeValue(targets.tableRow)}"][data-column="${cssAttributeValue(targets.tableColumn)}"]`
}

function cssAttributeValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
