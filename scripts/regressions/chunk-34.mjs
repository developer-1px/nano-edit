import { createNanoCommandPalette } from '../../src/nano-command-palette.ts'
import { assert, test } from './harness.mjs'

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName
    this.children = []
    this.dataset = {}
    this.listeners = []
    this.style = {
      removeProperty: () => {},
      setProperty: () => {},
    }
  }

  addEventListener(...args) {
    this.listeners.push(args)
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
      removedDocumentListeners.map(([eventName]) => eventName),
      ['keydown', 'click'],
    )
  } finally {
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
})
