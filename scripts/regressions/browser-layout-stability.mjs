import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { layoutFixtureDocument } from './layout-fixture-document.mjs'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const storageKey = demoStorageKey()
const viewports = [
  { name: 'desktop', width: 1280, height: 900, mobile: false },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'mobile-360', width: 360, height: 740, mobile: true },
]
const focusTargets = [
  ['heading', '[data-id="layout-title"]'],
  ['long link', '[data-id="layout-link"] a.nano-md-link'],
  ['bold', '[data-id="layout-link"] strong.nano-md-bold'],
  ['italic', '[data-id="layout-link"] em.nano-md-italic'],
  ['highlight', '[data-id="layout-link"] .nano-highlight'],
  ['inline code', '[data-id="layout-link"] .nano-inline-code'],
  ['tag', '[data-id="layout-link"] .nano-tag'],
  ['note link', '[data-id="layout-link"] .nano-note-link'],
  ['footnote ref', '[data-id="layout-link"] .nano-footnote-ref'],
  ['todo', '[data-id="layout-todo"] .nano-block-content'],
  ['ordered list', '[data-id="layout-ordered"] .nano-block-content'],
]

const vitePort = await freePort()
const chromePort = await freePort()
const userDataDir = await mkdtemp(join(tmpdir(), 'nano-edit-layout-chrome-'))
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

  for (const viewport of viewports) {
    await runViewport(browser, `http://127.0.0.1:${vitePort}/`, viewport)
    console.log(`ok layout stability ${viewport.name}`)
  }
} finally {
  try { browser?.close() } catch {}
  if (chrome && !chrome.killed) chrome.kill('SIGTERM')
  if (!vite.killed) vite.kill('SIGTERM')
  await Promise.allSettled([
    chrome ? onceExit(chrome) : Promise.resolve(),
    onceExit(vite),
    rm(userDataDir, { recursive: true, force: true }),
  ])
}

async function runViewport(browser, url, viewport) {
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })
  await browser.send('Page.navigate', { url })
  await waitForExpression(browser, 'document.readyState !== "loading"')
  await evaluate(browser, `(() => {
    localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(layoutFixtureDocument))});
    return true
  })()`)
  await browser.send('Page.reload', { ignoreCache: true })
  await waitForExpression(browser, 'Boolean(document.querySelector("[data-id=\\"layout-link\\"] a.nano-md-link"))')
  await evaluate(browser, `(() => {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element
        ? event.target
        : event.target instanceof Node
          ? event.target.parentElement
          : null
      if (target?.closest('a')) event.preventDefault()
    }, true)
    return true
  })()`)

  assertPageLayout(await pageLayout(browser), viewport)
  await assertLongLinkDoesNotInflateLine(browser, viewport)

  for (const [name, selector] of focusTargets) {
    await assertFocusDoesNotMoveBlock(browser, viewport, name, selector)
  }
}

async function assertLongLinkDoesNotInflateLine(browser, viewport) {
  const sample = await measureTarget(browser, '[data-id="layout-link"] a.nano-md-link')
  const limit = sample.lineHeight * (viewport.mobile ? 3.2 : 1.8)
  assert(
    sample.block.height <= limit,
    `${viewport.name}: long link paragraph height ${sample.block.height}px exceeds ${limit}px`,
  )
  assert(
    sample.after.position === 'absolute' && sample.after.height === '0px',
    `${viewport.name}: hidden link close token must stay off-flow, got position=${sample.after.position} height=${sample.after.height}`,
  )
}

async function assertFocusDoesNotMoveBlock(browser, viewport, name, selector) {
  await scrollTargetIntoView(browser, selector)
  const before = await measureTarget(browser, selector)
  await clickTarget(browser, selector)
  await wait(80)
  const after = await measureTarget(browser, selector)
  assertStableRect(before.block, after.block, 2, `${viewport.name}: ${name} block moved after focus`)
  assertStableRect(before.parent, after.parent, 2, `${viewport.name}: ${name} parent moved after focus`)
  assertPageLayout(await pageLayout(browser), viewport)
}

function assertPageLayout(layout, viewport) {
  assert(
    layout.scrollWidth <= layout.viewportWidth + 1,
    `${viewport.name}: page has horizontal overflow ${layout.scrollWidth}px > ${layout.viewportWidth}px`,
  )
  assert(layout.document.left >= -1, `${viewport.name}: document starts outside viewport at ${layout.document.left}px`)
  assert(
    layout.document.right <= layout.viewportWidth + 1,
    `${viewport.name}: document exceeds viewport right edge at ${layout.document.right}px`,
  )
  if (viewport.mobile) {
    assert(layout.document.left <= 56, `${viewport.name}: mobile document left ${layout.document.left}px reserves too much source lane`)
    assert(
      layout.document.width >= Math.min(320, viewport.width - 48),
      `${viewport.name}: mobile document width ${layout.document.width}px is too narrow`,
    )
  }
  for (const item of layout.media) {
    assert(
      item.right <= layout.document.right + 1,
      `${viewport.name}: ${item.selector} escapes document width (${item.right}px > ${layout.document.right}px)`,
    )
  }
}

async function pageLayout(browser) {
  return evaluate(browser, `(() => {
    const documentElement = document.querySelector('.ProseMirror.nano-document')
    const docRect = rect(documentElement)
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      document: docRect,
      media: [
        ['.nano-table', document.querySelector('.nano-table')],
        ['.nano-code', document.querySelector('.nano-code')],
        ['.nano-image img', document.querySelector('.nano-image img')],
      ].filter(([, element]) => element).map(([selector, element]) => ({ selector, ...rect(element) })),
    }
  })()`)
}

async function measureTarget(browser, selector) {
  return evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing target: ${selector}')
    const block = target.closest('.nano-block') || target
    const parent = target.closest('p,h1,h2,h3,h4,h5,h6,.nano-todo,.nano-list-item,.nano-footnote') || block
    const lineHeight = numericLineHeight(getComputedStyle(block))
      || numericLineHeight(getComputedStyle(document.querySelector('.nano-document')))
      || 24
    const after = getComputedStyle(target, '::after')
    return {
      block: rect(block),
      parent: rect(parent),
      target: rect(target),
      lineHeight,
      after: {
        position: after.position,
        height: after.height,
        whiteSpace: after.whiteSpace,
      },
    }
  })()`)
}

async function scrollTargetIntoView(browser, selector) {
  await evaluate(browser, `(() => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) throw new Error('Missing target: ${selector}')
    target.scrollIntoView({ block: 'center', inline: 'nearest' })
  })()`)
  await wait(40)
}

async function clickTarget(browser, selector) {
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

function assertStableRect(before, after, tolerance, message) {
  for (const key of ['top', 'left', 'width', 'height']) {
    const delta = Math.abs(after[key] - before[key])
    assert(delta <= tolerance, `${message}: ${key} changed by ${delta}px (${before[key]} -> ${after[key]})`)
  }
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
    expression: withHelpers(expression),
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  }
  return result.result.value
}

function withHelpers(expression) {
  return `(() => {
    const rect = (element) => {
      if (!element) throw new Error('Missing element for rect')
      const box = element.getBoundingClientRect()
      return {
        top: round(box.top),
        right: round(box.right),
        bottom: round(box.bottom),
        left: round(box.left),
        width: round(box.width),
        height: round(box.height),
      }
    }
    const round = (value) => Math.round(value * 100) / 100
    const numericLineHeight = (style) => {
      const value = Number.parseFloat(style.lineHeight)
      return Number.isFinite(value) ? value : null
    }
    return (${expression})
  })()`
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

function demoStorageKey() {
  const source = readFileSync(new URL('../../src/demo/persisted-document.ts', import.meta.url), 'utf8')
  const match = /DEMO_DOCUMENT_STORAGE_KEY\s*=\s*'([^']+)'/.exec(source)
  if (!match) throw new Error('Could not find DEMO_DOCUMENT_STORAGE_KEY')
  return match[1]
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
  if (!found) throw new Error('Chrome executable not found. Set CHROME_PATH to run layout stability tests.')
  return found
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

function pipeProcessOutput(child) {
  const chunks = []
  const collect = (chunk) => {
    chunks.push(String(chunk))
    while (chunks.join('').length > 8000) chunks.shift()
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  return () => chunks.join('')
}

function onceExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('exit', resolve))
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
