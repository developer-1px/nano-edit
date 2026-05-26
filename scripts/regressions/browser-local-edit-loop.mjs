import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const storageKey = demoStorageKey()
const localEditText = ' Local Edit Loop 확인'
const tableEditText = ' / local edit'
const compositionEditText = ' 조합 입력'
const multilinePasteText = ' 붙여\n넣기'
const normalizedPasteText = ' 붙여 넣기'
const modifier = process.platform === 'darwin' ? 4 : 2

const vitePort = await freePort()
const chromePort = await freePort()
const userDataDir = await mkdtemp(join(tmpdir(), 'nano-edit-local-edit-chrome-'))
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort'], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
})
const viteOutput = pipeProcessOutput(vite)
let chrome
let browser

try {
  await waitForHttp(`http://127.0.0.1:${vitePort}/`, 'Vite dev server', () => viteOutput())

  chrome = spawn(chromePath(), [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--disable-background-networking',
    '--disable-gpu',
    'about:blank',
  ], { stdio: 'ignore' })
  browser = await connectChrome(chromePort)
  await browser.send('Page.enable')
  await browser.send('Runtime.enable')
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await runLocalEditLoop(browser, `http://127.0.0.1:${vitePort}/`)
  console.log('ok browser local edit loop')
} finally {
  try { browser?.close() } catch {}
  if (chrome && !chrome.killed) chrome.kill('SIGTERM')
  if (!vite.killed) vite.kill('SIGTERM')
  await Promise.allSettled([
    chrome ? onceExit(chrome) : Promise.resolve(),
    onceExit(vite),
  ])
  await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}

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

async function appendText(browser, selector, text) {
  await focusEnd(browser, selector)
  await browser.send('Input.insertText', { text })
}

async function composeText(browser, selector, text) {
  await focusEnd(browser, selector)
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!(target instanceof HTMLElement)) throw new Error('Missing composition target: ${selector}')
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : document.createRange()
    if (!target.contains(range.endContainer)) {
      range.selectNodeContents(target)
      range.collapse(false)
    }
    range.insertNode(document.createTextNode(${JSON.stringify(text)}))
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    target.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: ${JSON.stringify(text)},
      inputType: 'insertCompositionText',
      isComposing: true,
    }))
    target.dispatchEvent(new CompositionEvent('compositionend', {
      bubbles: true,
      data: ${JSON.stringify(text)},
    }))
    return true
  })()`)
}

async function pasteText(browser, selector, text) {
  await focusEnd(browser, selector)
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!(target instanceof HTMLElement)) throw new Error('Missing paste target: ${selector}')
    let event
    if (typeof ClipboardEvent === 'function' && typeof DataTransfer === 'function') {
      const data = new DataTransfer()
      data.setData('text/plain', ${JSON.stringify(text)})
      event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })
    } else {
      event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: (type) => type === 'text/plain' ? ${JSON.stringify(text)} : '' },
      })
    }
    target.dispatchEvent(event)
    return event.defaultPrevented
  })()`)
}

async function focusEnd(browser, selector) {
  await scrollTargetIntoView(browser, selector)
  await clickTarget(browser, selector)
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing focus target: ${selector}')
    if (target instanceof HTMLElement) target.focus()
    const range = document.createRange()
    range.selectNodeContents(target)
    range.collapse(false)
    const selection = window.getSelection()
    if (!selection) throw new Error('Missing selection')
    selection.removeAllRanges()
    selection.addRange(range)
    return true
  })()`)
}

async function blurEditor(browser) {
  await evaluate(browser, `(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.getSelection()?.removeAllRanges()
    return true
  })()`)
  await wait(120)
}

async function scrollTargetIntoView(browser, selector) {
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing target: ${selector}')
    target.scrollIntoView({ block: 'center', inline: 'nearest' })
    return true
  })()`)
  await wait(40)
}

async function clickTarget(browser, selector) {
  const center = await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing click target: ${selector}')
    const box = target.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  })()`)
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: center.x, y: center.y })
  await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: center.x, y: center.y, button: 'left', clickCount: 1 })
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: center.x, y: center.y, button: 'left', clickCount: 1 })
}

async function pressKey(browser, key, code, keyCode, modifiers) {
  await browser.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
  })
  await browser.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
  })
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

async function waitForExpression(browser, expression) {
  for (let index = 0; index < 120; index += 1) {
    if (await evaluate(browser, `Boolean(${expression})`)) return
    await wait(100)
  }
  throw new Error(`Timed out waiting for expression: ${expression}`)
}

async function evaluate(browser, expression) {
  const result = await browser.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  }
  return result.result.value
}

async function connectChrome(port) {
  for (let index = 0; index < 100; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      const targets = await response.json()
      const target = targets.find((candidate) => candidate.type === 'page')
      if (target?.webSocketDebuggerUrl) return cdpSession(target.webSocketDebuggerUrl)
    } catch {}
    await wait(100)
  }
  throw new Error('Timed out waiting for Chrome debugger')
}

function cdpSession(url) {
  const socket = new WebSocket(url)
  let nextId = 0
  const pending = new Map()
  const opened = new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return

    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  }

  return {
    async send(method, params = {}) {
      await opened
      const id = ++nextId
      socket.send(JSON.stringify({ id, method, params }))
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
    },
    close() {
      socket.close()
    },
  }
}

function demoStorageKey() {
  const source = readFileSync(new URL('../../src/demo/persisted-document.ts', import.meta.url), 'utf8')
  const match = source.match(/DEMO_DOCUMENT_STORAGE_KEY = '([^']+)'/)
  if (!match) throw new Error('Unable to read demo storage key')
  return match[1]
}

function chromePath() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]
  const found = candidates.find(existsSync)
  if (!found) throw new Error('Chrome executable not found')
  return found
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => resolve(address.port))
    })
    server.on('error', reject)
  })
}

async function waitForHttp(url, label, output) {
  for (let index = 0; index < 100; index += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await wait(100)
  }
  throw new Error(`Timed out waiting for ${label}\n${output()}`)
}

function pipeProcessOutput(child) {
  let output = ''
  child.stdout?.on('data', (chunk) => { output += chunk })
  child.stderr?.on('data', (chunk) => { output += chunk })
  return () => output
}

function onceExit(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('exit', resolve))
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
