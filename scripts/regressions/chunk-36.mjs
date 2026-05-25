import { createNanoInspectorMarkdownRuntime } from '../../src/view/nano-view-inspector-markdown.ts'
import { assert, test, textState } from './harness.mjs'

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName
    this.children = []
    this.dataset = {}
    this.listeners = []
  }

  addEventListener(...args) {
    this.listeners.push(args)
  }

  focus() {
    this.focusCount = (this.focusCount ?? 0) + 1
  }

  querySelector(selector) {
    if (selector !== 'textarea[data-active="true"]') return null
    return this.children.find((child) => child.tagName === 'textarea' && child.dataset.active === 'true') ?? null
  }

  replaceChildren(...children) {
    this.children = children
  }
}

function restoreDocument(originalDocument) {
  if (originalDocument === undefined) {
    delete globalThis.document
  } else {
    globalThis.document = originalDocument
  }
}

test('Source command focuses the active Markdown source editor', () => {
  const originalDocument = globalThis.document
  const markdownOutput = new FakeElement('div')
  const shellCalls = []

  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
  }

  try {
    const runtime = createNanoInspectorMarkdownRuntime(
      {
        collapsedBlockIds: new Set(),
        markdownOutput,
        shell: {
          showInspector: (tab) => shellCalls.push(tab),
        },
        view: {
          state: textState('draft source'),
        },
      },
      {
        selectBlockById: () => {},
      },
    )

    assert.equal(runtime.focusActiveMarkdownSource(), true)
  } finally {
    restoreDocument(originalDocument)
  }

  assert.deepEqual(shellCalls, ['markdown'])
  assert.equal(markdownOutput.children.length, 1)
  assert.equal(markdownOutput.children[0].tagName, 'textarea')
  assert.equal(markdownOutput.children[0].dataset.blockId, 'b1')
  assert.equal(markdownOutput.children[0].focusCount, 1)
})

test('Source Escape resets value and textarea rows', () => {
  const originalDocument = globalThis.document
  const markdownOutput = new FakeElement('div')
  const view = {
    focused: 0,
    focus() {
      this.focused += 1
    },
    state: textState('draft source'),
  }

  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
  }

  try {
    const runtime = createNanoInspectorMarkdownRuntime(
      {
        collapsedBlockIds: new Set(),
        markdownOutput,
        shell: {
          showInspector: () => {},
        },
        view,
      },
      {
        selectBlockById: () => {},
      },
    )

    assert.equal(runtime.focusActiveMarkdownSource(), true)
    const editor = markdownOutput.children[0]
    const inputListener = editor.listeners.find(([eventName]) => eventName === 'input')?.[1]
    const keydownListener = editor.listeners.find(([eventName]) => eventName === 'keydown')?.[1]
    editor.value = 'draft\nsource\nextra'
    inputListener()
    assert.equal(editor.rows, 3)

    let prevented = false
    keydownListener({
      key: 'Escape',
      preventDefault: () => {
        prevented = true
      },
    })

    assert.equal(prevented, true)
    assert.equal(editor.value, 'draft source')
    assert.equal(editor.rows, 1)
    assert.equal(view.focused, 1)
  } finally {
    restoreDocument(originalDocument)
  }
})
