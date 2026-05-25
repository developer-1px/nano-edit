import { createNanoCommandPalette } from '../../src/view/nano-command-palette.ts'
import { assert, test } from './harness.mjs'

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName
    this.children = []
    this.dataset = {}
    this.attributes = new Map()
    this.listeners = []
    this.removedListeners = []
    this.style = {
      removeProperty: () => {},
      setProperty: () => {},
    }
  }

  addEventListener(...args) {
    this.listeners.push(args)
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name) {
    return this.attributes.has(name)
  }

  removeEventListener(...args) {
    this.removedListeners.push(args)
  }

  removeAttribute(name) {
    this.attributes.delete(name)
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }

  append(...children) {
    this.children.push(...children)
  }

  contains(target) {
    return target === this || this.children.includes(target)
  }

  focus() {
    this.focusCount = (this.focusCount ?? 0) + 1
  }

  replaceChildren(...children) {
    this.children = children
  }
}

function restoreFakeBrowser({
  originalCancelAnimationFrame,
  originalDocument,
  originalRequestAnimationFrame,
}) {
  if (originalDocument === undefined) {
    delete globalThis.document
  } else {
    globalThis.document = originalDocument
  }
  if (originalRequestAnimationFrame === undefined) {
    delete globalThis.requestAnimationFrame
  } else {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  }
  if (originalCancelAnimationFrame === undefined) {
    delete globalThis.cancelAnimationFrame
  } else {
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame
  }
}

test('Command palette cancels pending focus when destroyed', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  const frames = new Map()
  const canceledFrames = []
  const removedDocumentListeners = []
  let nextFrameId = 1

  globalThis.document = {
    addEventListener: () => {},
    createElement: (tagName) => new FakeElement(tagName),
    removeEventListener: (...args) => removedDocumentListeners.push(args),
  }
  globalThis.requestAnimationFrame = (callback) => {
    const id = nextFrameId
    nextFrameId += 1
    frames.set(id, callback)
    return id
  }
  globalThis.cancelAnimationFrame = (id) => {
    canceledFrames.push(id)
  }

  try {
    const palette = createNanoCommandPalette({
      commandAnchorRect: () => null,
      commands: () => [],
      onCommandClose: () => {
        throw new Error('destroy should not restore editor focus')
      },
    })

    palette.openCommandPalette('global')
    const pendingFrame = frames.get(1)
    palette.destroy()
    palette.openCommandPalette('global')
    pendingFrame()

    assert.deepEqual(canceledFrames, [1])
    assert.equal(palette.commandPalette.children[0].focusCount ?? 0, 0)
    assert.deepEqual(
      palette.commandPalette.children[0].removedListeners.map(([eventName]) => eventName),
      ['input', 'keydown'],
    )
    assert.deepEqual(
      removedDocumentListeners.map(([eventName]) => eventName),
      ['keydown', 'click'],
    )
  } finally {
    restoreFakeBrowser({
      originalCancelAnimationFrame,
      originalDocument,
      originalRequestAnimationFrame,
    })
  }
})

test('Command palette exposes combobox listbox selection state', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame

  globalThis.document = {
    addEventListener: () => {},
    createElement: (tagName) => new FakeElement(tagName),
    removeEventListener: () => {},
  }
  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }
  globalThis.cancelAnimationFrame = () => {}

  try {
    const palette = createNanoCommandPalette({
      commandAnchorRect: () => null,
      commands: () => [
        { id: 'source', title: 'Source', hint: 'Panel', run: () => {} },
        { id: 'copy', title: 'Copy', run: () => {} },
      ],
      onCommandClose: () => {},
    })
    const [input, list] = palette.commandPalette.children

    assert.equal(input.getAttribute('role'), 'combobox')
    assert.equal(input.getAttribute('aria-autocomplete'), 'list')
    assert.equal(input.getAttribute('aria-controls'), list.id)
    assert.equal(input.getAttribute('aria-expanded'), 'false')
    assert.equal(list.getAttribute('role'), 'listbox')

    palette.openCommandPalette('global')

    assert.equal(input.getAttribute('aria-expanded'), 'true')
    assert.equal(input.getAttribute('aria-activedescendant'), list.children[0].id)
    assert.equal(list.children[0].getAttribute('role'), 'option')
    assert.equal(list.children[0].getAttribute('aria-selected'), 'true')
    assert.equal(list.children[1].getAttribute('aria-selected'), 'false')

    const keydown = input.listeners.find(([eventName]) => eventName === 'keydown')[1]
    keydown({
      key: 'ArrowDown',
      preventDefault: () => {},
      shiftKey: false,
    })

    assert.equal(input.getAttribute('aria-activedescendant'), list.children[1].id)
    assert.equal(list.children[0].getAttribute('aria-selected'), 'false')
    assert.equal(list.children[1].getAttribute('aria-selected'), 'true')

    palette.destroy()

    assert.equal(input.getAttribute('aria-expanded'), 'false')
    assert.equal(input.hasAttribute('aria-activedescendant'), false)
  } finally {
    restoreFakeBrowser({
      originalCancelAnimationFrame,
      originalDocument,
      originalRequestAnimationFrame,
    })
  }
})
