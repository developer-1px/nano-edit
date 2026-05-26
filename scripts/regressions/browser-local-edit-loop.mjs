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
  await waitForExpression(browser, 'Boolean(document.querySelector("[data-id=\\"md-1\\"]"))')

  const initial = await documentSnapshot(browser)
  assert.equal(initial.title, 'Nano Edit')
  assert.equal(initial.visibleSourceWidgets, 0)
  assert.equal(initial.hasSelfDescription, true)
  assert.equal(initial.hasTableCell, true)

  await appendText(browser, '[data-id="md-2"]', localEditText)
  await waitForExpression(browser, storedTextIncludesExpression('md-2', localEditText))

  await clickTarget(browser, '[data-id="md-12"] .nano-todo-box')
  await waitForExpression(browser, storedTodoCheckedExpression('md-12', true))

  await appendText(browser, '[data-id="md-15"] td[data-row="3"][data-column="2"]', tableEditText)
  await waitForExpression(browser, storedTableCellIncludesExpression(tableEditText))

  await pressKey(browser, 'z', 'KeyZ', 90, modifier)
  await waitForExpression(browser, `!(${storedTableCellIncludesExpression(tableEditText)})`)

  await evaluate(browser, `(() => {
    const editor = document.querySelector('.ProseMirror')
    if (editor instanceof HTMLElement) editor.focus()
    return true
  })()`)
  await pressKey(browser, 'y', 'KeyY', 89, modifier)
  await waitForExpression(browser, storedTableCellIncludesExpression(tableEditText))

  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, `document.querySelector('[data-id="md-2"]')?.textContent.includes(${JSON.stringify(localEditText)})`)
  const restored = await documentSnapshot(browser)
  assert.equal(restored.todoChecked, true)
  assert.equal(restored.tableCell.includes(tableEditText), true)
  assert.equal(restored.visibleSourceWidgets, 0)
}

async function documentSnapshot(browser) {
  return evaluate(browser, `(() => {
    return {
      title: document.querySelector('[data-id="md-1"] .nano-block-content')?.textContent?.trim() ?? '',
      hasSelfDescription: Boolean(document.body.textContent?.includes('AI가 만든 Markdown 문서')),
      hasTableCell: Boolean([...document.querySelectorAll('[data-id="md-15"] td')].some((cell) => cell.textContent?.includes('cursor 주변 affordance'))),
      tableCell: [...document.querySelectorAll('[data-id="md-15"] td')]
        .find((cell) => cell.dataset.row === '3' && cell.dataset.column === '2')
        ?.textContent ?? '',
      todoChecked: document.querySelector('[data-id="md-12"] .nano-todo-box')?.getAttribute('aria-checked') === 'true',
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

async function appendText(browser, selector, text) {
  await focusEnd(browser, selector)
  await browser.send('Input.insertText', { text })
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

function storedTableCellIncludesExpression(text) {
  return `JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || 'null')?.blocks?.find((block) => block.id === 'md-15')?.rows?.[3]?.[2]?.includes(${JSON.stringify(text)}) === true`
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
