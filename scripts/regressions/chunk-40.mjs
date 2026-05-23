import { readFileSync } from 'node:fs'
import { createNanoInputClickHandlers } from '../../src/nano-view-input-click-events.ts'
import { assert, blockDomSpec, nanoMarkdownFromDocument, nanoBlocksFromProseMirror, test, textSelectionState } from './harness.mjs'

function specText(spec) {
  if (typeof spec === 'string') return spec
  if (!Array.isArray(spec)) return ''
  return spec.map(specText).join('')
}

test('Decorative Markdown tokens stay out of document text', () => {
  const todoText = specText(blockDomSpec({
    id: 'todo',
    type: 'todo',
    checked: true,
    checkedMarker: 'X',
    indent: 0,
    text: 'Done',
    marks: [],
  }))
  const footnoteText = specText(blockDomSpec({
    id: 'footnote',
    type: 'footnote',
    name: 'draft',
    text: 'Source detail',
    marks: [],
  }))
  const css = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const hiddenBlockTokenRule = /\.nano-block-md-prefix,[\s\S]*?\.nano-table-markdown \{([\s\S]*?)\n\}/.exec(css)

  assert.equal(todoText.includes('- [X]'), false)
  assert.equal(todoText.includes('- [ ]'), false)
  assert.equal(footnoteText.includes('[^draft]:'), false)
  assert(hiddenBlockTokenRule, 'hidden block source token rule should be present')
  assert(hiddenBlockTokenRule[1].includes('display: none;'))
  assert.equal(hiddenBlockTokenRule[1].includes('position: absolute;'), false)
})

test('Todo checkbox exposes state without visible Markdown syntax', () => {
  const checkedSpec = blockDomSpec({
    id: 'todo',
    type: 'todo',
    checked: true,
    checkedMarker: 'X',
    indent: 0,
    text: 'Done',
    marks: [],
  })
  const checkbox = checkedSpec.find((child) => Array.isArray(child) && child[1]?.class === 'nano-todo-box')

  assert(checkbox)
  assert.equal(checkbox[1].role, 'checkbox')
  assert.equal(checkbox[1]['aria-checked'], 'true')
  assert.equal(checkbox[1]['aria-label'], 'Todo')
  assert.equal(checkbox[1].tabindex, '0')
  assert.equal(checkbox[1].title, 'Done')
  assert.equal(specText(checkbox).includes('- [X]'), false)
})

test('Todo checkbox keeps a measurable hit target', () => {
  const css = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const checkboxRule = /\.nano-todo-box \{([\s\S]*?)\n\}/.exec(css)

  assert(checkboxRule, 'todo checkbox rule should be present')
  assert(checkboxRule[1].includes('width: 20px;'))
  assert(checkboxRule[1].includes('height: 24px;'))
  assert.equal(checkboxRule[1].includes('font-size: 0;'), false)
})

test('Todo checkbox toggles from keyboard without exposing Markdown syntax', () => {
  const originalElement = globalThis.Element
  class FakeElement {
    constructor(className, dataset = {}, parent = null) {
      this.className = className
      this.dataset = dataset
      this.parent = parent
    }

    closest(selector) {
      if (selector === '.nano-todo-box') {
        return this.className === 'nano-todo-box' ? this : null
      }
      if (selector === '.nano-block[data-id]') {
        return this.parent?.dataset?.id ? this.parent : null
      }
      return null
    }
  }

  globalThis.Element = FakeElement
  try {
    const block = new FakeElement('nano-block nano-todo', { id: 'md-1' })
    const checkbox = new FakeElement('nano-todo-box', {}, block)
    const handlers = createNanoInputClickHandlers({ dispatchAndReveal: () => {} }, {
      toggleCollapsedBlock: () => {},
    })
    const view = {
      focused: 0,
      state: textSelectionState('- [ ] Task', 'md-1', 0),
      dispatch(transaction) {
        this.state = this.state.apply(transaction)
      },
      focus() {
        this.focused += 1
      },
    }
    let prevented = false

    assert.equal(handlers.handleEditorKeydown(view, {
      key: ' ',
      target: checkbox,
      preventDefault: () => {
        prevented = true
      },
    }), true)

    assert.equal(prevented, true)
    assert.equal(view.focused, 1)
    assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(view.state.doc) }), '- [x] Task')
  } finally {
    if (originalElement === undefined) delete globalThis.Element
    else globalThis.Element = originalElement
  }
})

test('Fold indicator toggles section from keyboard without extra visible chrome', () => {
  const originalElement = globalThis.Element
  class FakeElement {
    constructor(className, dataset = {}, parent = null) {
      this.className = className
      this.dataset = dataset
      this.parent = parent
    }

    closest(selector) {
      if (selector === '.nano-list-fold, .nano-heading-fold') {
        return this.className === 'nano-heading-fold' || this.className === 'nano-list-fold' ? this : null
      }
      if (selector === '.nano-block[data-id]') {
        return this.parent?.dataset?.id ? this.parent : null
      }
      return null
    }
  }

  globalThis.Element = FakeElement
  try {
    const block = new FakeElement('nano-block nano-heading', { id: 'md-1' })
    const fold = new FakeElement('nano-heading-fold', {}, block)
    const toggled = []
    const handlers = createNanoInputClickHandlers({ dispatchAndReveal: () => {} }, {
      toggleCollapsedBlock: (id) => toggled.push(id),
    })
    const view = {
      focused: 0,
      state: textSelectionState('# Heading', 'md-1', 0),
      dispatch() {},
      focus() {
        this.focused += 1
      },
    }
    let prevented = false

    assert.equal(handlers.handleEditorKeydown(view, {
      key: 'Enter',
      target: fold,
      preventDefault: () => {
        prevented = true
      },
    }), true)

    assert.deepEqual(toggled, ['md-1'])
    assert.equal(prevented, true)
    assert.equal(view.focused, 1)
  } finally {
    if (originalElement === undefined) delete globalThis.Element
    else globalThis.Element = originalElement
  }
})
