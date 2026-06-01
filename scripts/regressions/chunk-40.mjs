import { readFileSync } from 'node:fs'
import { createNanoInputClickHandlers } from '../../src/view/input/click-events.ts'
import {
  inlineAutocompleteContextFromInput,
  inlineAutocompleteContextFromMode,
  inlineAutocompleteContextFromTrigger,
  inlineAutocompleteInsertedText,
  inlineAutocompleteMatchFromText,
} from '../../src/inline-autocomplete/index.ts'
import {
  inlineEditHasLineBreak,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSingleLineText,
  isInlineEditLineBreakInput,
} from '../../src/inline-edit/index.ts'
import { assert, blockDomSpec, nanoMarkdownFromDocument, nanoBlocksFromProseMirror, test, textSelectionState } from './harness.mjs'

function specText(spec) {
  if (typeof spec === 'string') return spec
  if (!Array.isArray(spec)) return ''
  return spec.map(specText).join('')
}

function domSpecElementsByClass(spec, className) {
  if (!Array.isArray(spec)) return []
  const attrs = spec[1] && typeof spec[1] === 'object' && !Array.isArray(spec[1]) ? spec[1] : null
  const own = typeof attrs?.class === 'string' && attrs.class.split(/\s+/).includes(className) ? [spec] : []
  return own.concat(spec.flatMap((part) => domSpecElementsByClass(part, className)))
}

test('Inline edit helpers cover local single-line editing policy', () => {
  assert.equal(inlineEditHistoryDirectionFromInputType('historyUndo'), 'undo')
  assert.equal(inlineEditHistoryDirectionFromInputType('historyRedo'), 'redo')
  assert.equal(inlineEditHistoryDirectionFromInputType('insertText'), null)
  assert.equal(inlineEditHistoryDirectionFromKeydown({ key: 'z', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }), 'undo')
  assert.equal(inlineEditHistoryDirectionFromKeydown({ key: 'z', metaKey: true, ctrlKey: false, altKey: false, shiftKey: true }), 'redo')
  assert.equal(inlineEditHistoryDirectionFromKeydown({ key: 'y', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false }), 'redo')
  assert.equal(inlineEditHistoryDirectionFromKeydown({ key: 'z', metaKey: true, ctrlKey: false, altKey: true, shiftKey: false }), null)
  assert.equal(isInlineEditLineBreakInput('insertLineBreak'), true)
  assert.equal(isInlineEditLineBreakInput('insertParagraph'), true)
  assert.equal(isInlineEditLineBreakInput('insertText'), false)
  assert.equal(inlineEditHasLineBreak('a\nb'), true)
  assert.equal(inlineEditHasLineBreak('a\r\nb'), true)
  assert.equal(inlineEditHasLineBreak('ab'), false)
  assert.equal(inlineEditSingleLineText('붙여\r\n넣기\n\n확인'), '붙여 넣기 확인')
})

test('Inline autocomplete extension maps triggers to reusable contexts', () => {
  const triggers = [
    { mode: 'mention', trigger: '@' },
    { mode: 'slash', trigger: '/' },
  ]

  assert.deepEqual(
    inlineAutocompleteContextFromInput('@', 4, triggers),
    { mode: 'mention', offset: 4, trigger: '@' },
  )
  assert.deepEqual(
    inlineAutocompleteContextFromMode('slash', 8, triggers),
    { mode: 'slash', offset: 8, trigger: '/' },
  )
  assert.deepEqual(
    inlineAutocompleteContextFromTrigger('/', 2, triggers),
    { mode: 'slash', offset: 2, trigger: '/' },
  )
  assert.equal(inlineAutocompleteContextFromInput('x', 4, triggers), null)
  assert.equal(inlineAutocompleteInsertedText('@Mina'), '@Mina ')
  assert.equal(inlineAutocompleteInsertedText('/summary', { suffix: '' }), '/summary')

  assert.deepEqual(
    inlineAutocompleteMatchFromText('Assign @mi', 10, triggers),
    {
      context: { mode: 'mention', offset: 7, trigger: '@' },
      query: 'mi',
      replaceFrom: 7,
      replaceTo: 10,
    },
  )
  assert.deepEqual(
    inlineAutocompleteMatchFromText('Use /sum now', 8, triggers),
    {
      context: { mode: 'slash', offset: 4, trigger: '/' },
      query: 'sum',
      replaceFrom: 4,
      replaceTo: 8,
    },
  )
  assert.equal(inlineAutocompleteMatchFromText('Assign @mi now', 14, triggers), null)

  // allowSpaces keeps search-style triggers (e.g. [[wiki links]], @page) alive
  // across spaces, while a line break still closes the query.
  const wikiTriggers = [{ mode: 'wikilink', trigger: '[[', allowSpaces: true }]
  assert.deepEqual(
    inlineAutocompleteMatchFromText('See [[Release Pla', 17, wikiTriggers),
    {
      context: { mode: 'wikilink', offset: 4, trigger: '[[' },
      query: 'Release Pla',
      replaceFrom: 4,
      replaceTo: 17,
    },
  )
  assert.equal(inlineAutocompleteMatchFromText('See [[Release\nPla', 17, wikiTriggers), null)

  assert.deepEqual(
    inlineAutocompleteMatchFromText('Hello {{user', 12, [
      { mode: 'variable', trigger: '{{' },
      { mode: 'slash', trigger: '/' },
    ]),
    {
      context: { mode: 'variable', offset: 6, trigger: '{{' },
      query: 'user',
      replaceFrom: 6,
      replaceTo: 12,
    },
  )
  assert.deepEqual(
    inlineAutocompleteMatchFromText('Ask @mina /sum', 14, triggers),
    {
      context: { mode: 'slash', offset: 10, trigger: '/' },
      query: 'sum',
      replaceFrom: 10,
      replaceTo: 14,
    },
  )
  assert.deepEqual(
    inlineAutocompleteMatchFromText('Assign @mi', 99, triggers),
    {
      context: { mode: 'mention', offset: 7, trigger: '@' },
      query: 'mi',
      replaceFrom: 7,
      replaceTo: 10,
    },
  )
})

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

test('Hidden block source tokens stay out of the accessibility surface', () => {
  const tokenCases = [
    ['heading prefix', blockDomSpec({ id: 'heading', type: 'heading', level: 2, text: 'Title', marks: [] }), 'nano-block-md-prefix'],
    ['quote prefix', blockDomSpec({ id: 'quote', type: 'quote', text: 'Quote', marks: [] }), 'nano-block-md-prefix'],
    ['callout marker', blockDomSpec({ id: 'callout', type: 'callout', tone: 'tip', text: 'Tip', marks: [] }), 'nano-callout-marker'],
    ['code fence', blockDomSpec({ id: 'code', type: 'code', language: 'ts', text: 'const x = 1' }), 'nano-code-fence'],
    ['math fence', blockDomSpec({ id: 'math', type: 'math', text: 'E=mc^2' }), 'nano-math-fence'],
    ['divider marker', blockDomSpec({ id: 'divider', type: 'divider' }), 'nano-divider-token'],
    ['attachment source', blockDomSpec({ id: 'attachment', type: 'attachment', src: 'files/brief.pdf', label: 'Brief' }), 'nano-attachment-src'],
    ['note ref token', blockDomSpec({ id: 'note', type: 'note_ref', target: 'Release Notes' }), 'nano-note-ref-token'],
    ['image source', blockDomSpec({ id: 'image', type: 'image', src: 'assets/cover.png', alt: 'cover' }), 'nano-image-markdown'],
    ['table source', blockDomSpec({ id: 'table', type: 'table', rows: [['A', 'B'], ['1', '2']] }), 'nano-table-markdown'],
  ]

  for (const [label, spec, className] of tokenCases) {
    const tokens = domSpecElementsByClass(spec, className)
    assert(tokens.length > 0, `${label} should expose a hidden source token`)
    for (const token of tokens) {
      assert.equal(token[1].contenteditable, 'false', `${label} should not be directly editable`)
      assert.equal(token[1]['aria-hidden'], 'true', `${label} should stay out of assistive reading`)
    }
  }
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
  const listRule = /\.nano-todo,\n\.nano-list-item \{([\s\S]*?)\n\}/.exec(css)
  const checkboxRule = /\.nano-todo-box \{([\s\S]*?)\n\}/.exec(css)
  const markerRule = /\.nano-list-marker \{([\s\S]*?)\n\}/.exec(css)

  assert(listRule, 'list layout rule should be present')
  assert(listRule[1].includes('grid-template-columns: 22px minmax(0, 1fr);'))
  assert.equal(listRule[1].includes('14px 20px'), false)
  assert(listRule[1].includes('align-items: start;'))
  assert.equal(listRule[1].includes('align-items: baseline;'), false)
  assert(checkboxRule, 'todo checkbox rule should be present')
  assert(checkboxRule[1].includes('width: 22px;'))
  assert(checkboxRule[1].includes('height: 1.64em;'))
  assert(checkboxRule[1].includes('place-items: center;'))
  assert.equal(checkboxRule[1].includes('padding-top:'), false)
  assert.equal(checkboxRule[1].includes('font-size: 0;'), false)
  assert(markerRule, 'list marker alignment rule should be present')
  assert(markerRule[1].includes('height: 1.64em;'))
  assert(markerRule[1].includes('align-items: center;'))
})

test('Todo checkbox toggles from keyboard without exposing Markdown syntax', () => {
  const originalElement = globalThis.Element
  class FakeElement {
    constructor(className, dataset = {}, parent = null) {
      this.className = className
      this.dataset = dataset
      this.parent = parent
      this.classList = {
        contains: (className) => this.className.split(/\s+/).includes(className),
      }
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
      this.classList = {
        contains: (className) => this.className.split(/\s+/).includes(className),
      }
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
    const block = new FakeElement('nano-block nano-heading nano-heading-collapsible', { id: 'md-1' })
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
