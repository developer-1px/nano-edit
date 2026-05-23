import { createNanoInspectorShell } from '../../src/nano-inspector-shell.ts'
import { destroyNanoView } from '../../src/nano-view-lifecycle.ts'
import { assert, test } from './harness.mjs'

class FakeElement {
  constructor(tagName, events = null) {
    this.tagName = tagName
    this.attributes = new Map()
    this.children = []
    this.dataset = {}
    this.events = events
    this.listeners = []
    this.style = {}
  }

  addEventListener(eventName, handler) {
    this.events?.added.push([this.tagName, eventName, handler])
    this.listeners.push([eventName, handler])
  }

  append(...children) {
    this.children.push(...children)
  }

  focus() {
    this.focusCount = (this.focusCount ?? 0) + 1
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null
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
    this.events?.removed.push([this.tagName, eventName, handler])
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }
}

function restoreDocument(originalDocument) {
  if (originalDocument === undefined) {
    delete globalThis.document
  } else {
    globalThis.document = originalDocument
  }
}

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
      slashKeydownListener: listener,
    }

    destroyNanoView(ctx)
    destroyNanoView(ctx)
  } finally {
    restoreDocument(originalDocument)
  }

  assert.deepEqual(calls, { root: 1, shell: 1, view: 1 })
  assert.deepEqual(
    removedEditorListeners.map(([eventName]) => eventName),
    ['keydown'],
  )
  assert.deepEqual(removedDocumentListeners, [])
})

test('Inspector shell destroy removes element listeners', () => {
  const originalDocument = globalThis.document
  const events = { added: [], removed: [] }

  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName, events),
    createElementNS: (_namespace, tagName) => new FakeElement(tagName, events),
  }

  try {
    const root = new FakeElement('section')
    const shell = createNanoInspectorShell({
      onIndexSearch: () => {},
      root,
    })

    shell.destroy()
  } finally {
    restoreDocument(originalDocument)
  }

  assert.deepEqual(
    events.added.map(([tagName, eventName]) => [tagName, eventName]),
    [
      ['input', 'input'],
      ['button', 'click'],
      ['button', 'keydown'],
      ['button', 'click'],
      ['button', 'keydown'],
      ['button', 'click'],
      ['button', 'click'],
      ['button', 'click'],
    ],
  )
  assert.deepEqual(events.removed, events.added)
})

test('Inspector tabs expose selected tab and panel relationships', () => {
  const originalDocument = globalThis.document
  const events = { added: [], removed: [] }

  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName, events),
    createElementNS: (_namespace, tagName) => new FakeElement(tagName, events),
  }

  try {
    const root = new FakeElement('section', events)
    const shell = createNanoInspectorShell({
      onIndexSearch: () => {},
      root,
    })
    const [header, body] = shell.inspectorElement.children
    const [tabs] = header.children
    const [indexTab, markdownTab] = tabs.children
    const [indexPanel, markdownPanel] = body.children

    assert.equal(shell.inspectorElement.ariaLabel, 'Inspector')
    assert.equal(tabs.getAttribute('role'), 'tablist')
    assert.equal(indexTab.getAttribute('role'), 'tab')
    assert.equal(markdownTab.getAttribute('role'), 'tab')
    assert.equal(indexPanel.getAttribute('role'), 'tabpanel')
    assert.equal(markdownPanel.getAttribute('role'), 'tabpanel')
    assert.equal(indexTab.getAttribute('aria-controls'), indexPanel.id)
    assert.equal(indexPanel.getAttribute('aria-labelledby'), indexTab.id)
    assert.equal(markdownTab.getAttribute('aria-controls'), markdownPanel.id)
    assert.equal(markdownPanel.getAttribute('aria-labelledby'), markdownTab.id)

    shell.showInspector('index')

    assert.equal(shell.inspectorTrigger.getAttribute('aria-expanded'), 'true')
    assert.equal(indexTab.getAttribute('aria-selected'), 'true')
    assert.equal(indexTab.tabIndex, 0)
    assert.equal(indexPanel.hidden, false)
    assert.equal(markdownTab.getAttribute('aria-selected'), 'false')
    assert.equal(markdownTab.tabIndex, -1)
    assert.equal(markdownPanel.hidden, true)

    const indexKeydown = indexTab.listeners.find(([eventName]) => eventName === 'keydown')[1]
    indexKeydown({
      key: 'ArrowRight',
      preventDefault: () => {},
    })

    assert.equal(indexTab.getAttribute('aria-selected'), 'false')
    assert.equal(indexPanel.hidden, true)
    assert.equal(markdownTab.getAttribute('aria-selected'), 'true')
    assert.equal(markdownTab.tabIndex, 0)
    assert.equal(markdownPanel.hidden, false)
    assert.equal(markdownTab.focusCount, 1)

    shell.setInspectorMode('pinned')
    const [, controls] = header.children
    const [pinButton] = controls.children
    assert.equal(pinButton.getAttribute('aria-pressed'), 'true')

    shell.setInspectorMode('hidden')
    assert.equal(shell.inspectorTrigger.getAttribute('aria-expanded'), 'false')
    shell.destroy()
  } finally {
    restoreDocument(originalDocument)
  }
})
