import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultDocumentPersistenceCodec } from '@interactive-os/json-document-persist-web'

export const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const CDP_RESPONSE_TIMEOUT_MS = 45_000

export async function withBrowserRegression(userDataPrefix, run) {
  await withViteBrowser(userDataPrefix, projectRoot, run)
}

export async function withViteBrowser(userDataPrefix, viteRoot, run) {
  const vitePort = await freePort()
  const chromePort = await freePort()
  const userDataDir = await mkdtemp(join(tmpdir(), userDataPrefix))
  const vite = spawn(process.execPath, [join(projectRoot, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort'], {
    cwd: viteRoot,
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
    await run({ browser, url: `http://127.0.0.1:${vitePort}/` })
  } finally {
    try { browser?.close() } catch {}
    await Promise.allSettled([
      chrome ? stopProcess(chrome) : Promise.resolve(),
      stopProcess(vite),
      rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }),
    ])
  }
}

export async function waitForExpression(browser, expression, wrapExpression = identityExpression) {
  for (let index = 0; index < 120; index += 1) {
    if (await evaluate(browser, `Boolean(${expression})`, wrapExpression)) return
    await wait(100)
  }
  throw new Error(`Timed out waiting for expression: ${expression}`)
}

export async function evaluate(browser, expression, wrapExpression = identityExpression) {
  const result = await browser.send('Runtime.evaluate', {
    expression: wrapExpression(expression),
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  }
  return result.result.value
}

export async function scrollTargetIntoView(browser, selector) {
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing target: ${selector}')
    target.scrollIntoView({ block: 'center', inline: 'nearest' })
  })()`)
  await wait(40)
}

export async function clickTarget(browser, selector) {
  const center = await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing target: ${selector}')
    target.scrollIntoView({ block: 'center', inline: 'nearest' })
    const box = target.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  })()`)
  await wait(60)
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: center.x, y: center.y })
  await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: center.x, y: center.y, button: 'left', clickCount: 1 })
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: center.x, y: center.y, button: 'left', clickCount: 1 })
}

export async function pressKey(browser, key, code, keyCode, modifiers) {
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

export function demoDocumentStorageKey() {
  return sourceStringConstant(new URL('../../src/demo/persisted-document.ts', import.meta.url), 'DEMO_DOCUMENT_STORAGE_KEY')
}

export function demoDeckStorageKey() {
  return sourceStringConstant(new URL('../../src/demo/persisted-deck.ts', import.meta.url), 'DEMO_DECK_STORAGE_KEY')
}

export function activeDemoArtifactStorageKey() {
  return sourceStringConstant(new URL('../../src/demo/demo-artifacts-app.ts', import.meta.url), 'ACTIVE_DEMO_ARTIFACT_STORAGE_KEY')
}

export function nano2ExampleStorageKey(exampleId) {
  const prefix = sourceStringConstant(new URL('../../src/nano2/examples/persistence.ts', import.meta.url), 'NANO2_EXAMPLE_STORAGE_KEY_PREFIX')
  return `${prefix}:${exampleId}`
}

export function storedPersistenceValueExpression(storageKey) {
  return `((stored) => stored && typeof stored === 'object' && 'value' in stored ? stored.value : stored)(JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || 'null'))`
}

export function persistenceSnapshotText(value) {
  return defaultDocumentPersistenceCodec.encode({ value, selection: null, savedAt: null })
}

function sourceStringConstant(sourceUrl, constantName) {
  const source = readFileSync(sourceUrl, 'utf8')
  const match = new RegExp(`${constantName}\\s*=\\s*'([^']+)'`).exec(source)
  if (!match) throw new Error(`Could not find ${constantName}`)
  return match[1]
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function connectChrome(port) {
  for (let index = 0; index < 120; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      if (response.ok) {
        const targets = await response.json()
        const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
        if (page) return cdpSession(page.webSocketDebuggerUrl)
      }
    } catch {}
    await wait(100)
  }
  throw new Error('Chrome remote debugging target did not start')
}

async function cdpSession(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl)
  let nextId = 1
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const callback = pending.get(message.id)
      pending.delete(message.id)
      callback(message)
    }
  })
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = nextId
      nextId += 1
      socket.send(JSON.stringify({ id, method, params }))
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pending.delete(id)
          reject(new Error(`Timed out waiting for Chrome response: ${method}`))
        }, CDP_RESPONSE_TIMEOUT_MS)
        pending.set(id, (message) => {
          clearTimeout(timeoutId)
          if (message.error) reject(new Error(`${method}: ${message.error.message}`))
          else resolve(message.result)
        })
      })
    },
  }
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

async function waitForHttp(url, name, details) {
  for (let index = 0; index < 120; index += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await wait(100)
  }
  throw new Error(`${name} did not start\n${details()}`)
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean)
  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) throw new Error('Chrome executable not found. Set CHROME_PATH to run browser regressions.')
  return found
}

function pipeProcessOutput(child) {
  const chunks = []
  const collect = (chunk) => {
    chunks.push(String(chunk))
    while (chunks.join('').length > 8000) chunks.shift()
  }
  child.stdout?.on('data', collect)
  child.stderr?.on('data', collect)
  return () => chunks.join('')
}

function onceExit(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('exit', resolve))
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  if (!child.killed) child.kill('SIGTERM')
  const exited = await Promise.race([
    onceExit(child).then(() => true),
    wait(2000).then(() => false),
  ])
  if (exited || child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGKILL')
  await Promise.race([
    onceExit(child),
    wait(2000),
  ])
}

function identityExpression(expression) {
  return expression
}
