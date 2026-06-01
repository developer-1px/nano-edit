import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

export async function withBrowserRegression(userDataPrefix, run) {
  const vitePort = await freePort()
  const chromePort = await freePort()
  const userDataDir = await mkdtemp(join(tmpdir(), userDataPrefix))
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
    await run({ browser, url: `http://127.0.0.1:${vitePort}/` })
  } finally {
    try { browser?.close() } catch {}
    if (chrome && !chrome.killed) chrome.kill('SIGTERM')
    if (!vite.killed) vite.kill('SIGTERM')
    await Promise.allSettled([
      chrome ? onceExit(chrome) : Promise.resolve(),
      onceExit(vite),
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
    const box = target.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  })()`)
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

export function demoStorageKey() {
  const source = readFileSync(new URL('../../src/demo/persisted-document.ts', import.meta.url), 'utf8')
  const match = /DEMO_DOCUMENT_STORAGE_KEY\s*=\s*'([^']+)'/.exec(source)
  if (!match) throw new Error('Could not find DEMO_DOCUMENT_STORAGE_KEY')
  return match[1]
}

export function storedPersistenceValueExpression(storageKey) {
  return `((stored) => stored?.kind === 'zod-crud.persistence+json' ? stored.value : stored)(JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}) || 'null'))`
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
      pending.get(message.id)(message)
      pending.delete(message.id)
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
        pending.set(id, (message) => {
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

function identityExpression(expression) {
  return expression
}
