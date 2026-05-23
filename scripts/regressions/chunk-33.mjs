import { writeClipboardText } from '../../src/nano-view-clipboard.ts'
import { assert } from './harness.mjs'

async function testAsync(name, run) {
  try {
    await run()
    console.log(`ok ${name}`)
  } catch (error) {
    console.error(`not ok ${name}`)
    throw error
  }
}

function installClipboardBrowser({ execCommand = () => true, writeText } = {}) {
  const originalDocument = globalThis.document
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const calls = {
    append: 0,
    exec: 0,
    focus: 0,
    remove: 0,
    restoreFocus: 0,
    select: 0,
    writeText: 0,
  }
  const textarea = {
    attributes: new Map(),
    style: {},
    value: '',
    focus: () => {
      calls.focus += 1
    },
    remove: () => {
      calls.remove += 1
    },
    select: () => {
      calls.select += 1
    },
    setAttribute: (name, value) => {
      textarea.attributes.set(name, value)
    },
  }

  globalThis.document = {
    activeElement: {
      focus: () => {
        calls.restoreFocus += 1
      },
    },
    body: {
      append: (element) => {
        calls.append += 1
        calls.appendedElement = element
      },
    },
    createElement: (tagName) => {
      calls.createdTagName = tagName
      return textarea
    },
    documentElement: {
      append: () => {
        calls.documentElementAppend = true
      },
    },
    execCommand: (command) => {
      calls.exec += 1
      calls.execCommand = command
      return execCommand(command)
    },
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: writeText
      ? {
          clipboard: {
            writeText: async (text) => {
              calls.writeText += 1
              return writeText(text)
            },
          },
        }
      : {},
  })

  return {
    calls,
    restore: () => {
      if (originalDocument === undefined) {
        delete globalThis.document
      } else {
        globalThis.document = originalDocument
      }
      if (navigatorDescriptor) {
        Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
      } else {
        delete globalThis.navigator
      }
    },
    textarea,
  }
}

await testAsync('Clipboard write falls back when browser clipboard rejects', async () => {
  const browser = installClipboardBrowser({
    writeText: async () => {
      throw new Error('permission denied')
    },
  })

  try {
    await writeClipboardText('copy me')
  } finally {
    browser.restore()
  }

  assert.equal(browser.calls.writeText, 1)
  assert.equal(browser.calls.createdTagName, 'textarea')
  assert.equal(browser.textarea.value, 'copy me')
  assert.equal(browser.textarea.attributes.get('readonly'), '')
  assert.equal(browser.calls.append, 1)
  assert.equal(browser.calls.focus, 1)
  assert.equal(browser.calls.select, 1)
  assert.equal(browser.calls.execCommand, 'copy')
  assert.equal(browser.calls.remove, 1)
  assert.equal(browser.calls.restoreFocus, 1)
})

await testAsync('Clipboard fallback reports failed copy command after cleanup', async () => {
  const browser = installClipboardBrowser({
    execCommand: () => false,
  })

  try {
    await assert.rejects(() => writeClipboardText('copy me'), /Clipboard copy failed/)
  } finally {
    browser.restore()
  }

  assert.equal(browser.calls.execCommand, 'copy')
  assert.equal(browser.calls.remove, 1)
  assert.equal(browser.calls.restoreFocus, 1)
})
