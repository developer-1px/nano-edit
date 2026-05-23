import { createNanoInspectorShell } from '../../src/nano-inspector-shell.ts'
import { destroyNanoView } from '../../src/nano-view-lifecycle.ts'
import { assert, test } from './harness.mjs'

test('Nano view destroy unmounts once and removes document listeners', () => {
  const originalDocument = globalThis.document
  const removedDocumentListeners = []
  const removedEditorListeners = []
  const calls = { root: 0, shell: 0, view: 0 }
  const listener = () => undefined

  globalThis.document = {
    removeEventListener: (...args) => removedDocumentListeners.push(args),
  }

  try {
    const ctx = {
      destroyed: false,
      editor: {
        removeEventListener: (...args) => removedEditorListeners.push(args),
      },
      root: {
        remove: () => {
          calls.root += 1
        },
      },
      shell: {
        destroy: () => {
          calls.shell += 1
        },
      },
      view: {
        destroy: () => {
          calls.view += 1
        },
      },
      blockAddClickListener: listener,
      blockHandleClickListener: listener,
      blockInsertHoverListener: listener,
      blockInsertKeydownListener: listener,
      gutterOutsideClickListener: listener,
    }

    destroyNanoView(ctx)
    destroyNanoView(ctx)
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = originalDocument
    }
  }

  assert.deepEqual(calls, { root: 1, shell: 1, view: 1 })
  assert.deepEqual(
    removedEditorListeners.map(([eventName]) => eventName),
    ['click', 'click', 'mouseover', 'keydown'],
  )
  assert.deepEqual(
    removedDocumentListeners.map(([eventName]) => eventName),
    ['click'],
  )
})

test('Inspector shell destroy removes element listeners', () => {
  const originalDocument = globalThis.document
  const added = []
  const removed = []

  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName
      this.children = []
      this.dataset = {}
      this.style = {}
    }

    addEventListener(eventName, handler) {
      added.push([this.tagName, eventName, handler])
    }

    append(...children) {
      this.children.push(...children)
    }

    querySelectorAll(selector) {
      if (selector !== '[data-inspector-tab]') return []
      const matches = []
      const visit = (node) => {
        if (node?.dataset?.inspectorTab) matches.push(node)
        for (const child of node?.children ?? []) visit(child)
      }
      visit(this)
      return matches
    }

    removeEventListener(eventName, handler) {
      removed.push([this.tagName, eventName, handler])
    }

    setAttribute(name, value) {
      this[name] = String(value)
    }
  }

  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
    createElementNS: (_namespace, tagName) => new FakeElement(tagName),
  }

  try {
    const root = new FakeElement('section')
    const shell = createNanoInspectorShell({
      onIndexSearch: () => {},
      root,
    })

    shell.destroy()
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = originalDocument
    }
  }

  assert.deepEqual(
    added.map(([tagName, eventName]) => [tagName, eventName]),
    [
      ['input', 'input'],
      ['button', 'click'],
      ['button', 'click'],
      ['button', 'click'],
      ['button', 'click'],
      ['button', 'click'],
    ],
  )
  assert.deepEqual(removed, added)
})
