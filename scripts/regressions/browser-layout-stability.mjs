import { layoutFixtureDocument } from './layout-fixture-document.mjs'
import {
  clickTarget,
  demoStorageKey,
  evaluate as evaluateInBrowser,
  scrollTargetIntoView,
  wait,
  waitForExpression,
  withBrowserRegression,
} from './browser-test-harness.mjs'

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

await withBrowserRegression('nano-edit-layout-chrome-', async ({ browser, url }) => {
  for (const viewport of viewports) {
    await runViewport(browser, url, viewport)
    console.log(`ok layout stability ${viewport.name}`)
  }
})

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

function assertStableRect(before, after, tolerance, message) {
  for (const key of ['top', 'left', 'width', 'height']) {
    const delta = Math.abs(after[key] - before[key])
    assert(delta <= tolerance, `${message}: ${key} changed by ${delta}px (${before[key]} -> ${after[key]})`)
  }
}

async function evaluate(browser, expression) {
  return evaluateInBrowser(browser, expression, withHelpers)
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

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
