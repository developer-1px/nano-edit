import { createNanoInputTextHandlers } from '../../src/view/input/text-events.ts'
import { createNanoSlashCommandRuntime } from '../../src/view/runtime/slash-command.ts'
import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

function typeShortcutText(initialState, text) {
  let state = initialState
  for (const input of text) {
    const { from, to } = state.selection
    const transaction = blockShortcutTransaction(state, from, to, input) ?? state.tr.insertText(input, from, to)
    state = state.apply(transaction)
  }
  return state
}

function markdownFromState(state) {
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(state.doc) })
}

function keydownEvent(key) {
  return {
    key,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true
    },
    stopPropagation() {
      this.propagationStopped = true
    },
  }
}

test('First slash in an empty text block opens the slash command palette', () => {
  const opened = []
  const view = {
    state: textState(''),
    dispatch() {
      throw new Error('slash palette input should not mutate the block')
    },
  }
  const handlers = createNanoInputTextHandlers(
    {
      collapsedBlockIds: new Set(),
      shell: {
        openCommandPalette: (mode, blockId) => opened.push([mode, blockId]),
      },
    },
    {
      restoreHistory: () => {},
      runMarkCommand: () => {},
      toggleCollapsedBlock: () => {},
    },
  )

  assert.equal(handlers.handleShortcutInput(view, view.state.selection.from, view.state.selection.from, '/'), true)
  assert.deepEqual(opened, [['slash', 'b1']])
  assert.equal(markdownFromState(view.state), '')
})

test('Slash keydown opens an empty text block before text input', () => {
  const opened = []
  const event = keydownEvent('/')
  const runtime = createNanoSlashCommandRuntime({
    view: { state: textState('') },
    blockRegistry: undefined,
    shell: {
      openCommandPalette: (mode, blockId) => opened.push([mode, blockId]),
    },
  })

  runtime.handleSlashKeydown(event)

  assert.equal(event.defaultPrevented, true)
  assert.equal(event.propagationStopped, true)
  assert.deepEqual(opened, [['slash', 'b1']])
})

test('Slash keydown leaves non-empty text blocks to normal text input', () => {
  const opened = []
  const event = keydownEvent('/')
  const runtime = createNanoSlashCommandRuntime({
    view: { state: textSelectionState('Already has text', 'md-1', 'Already has text'.length) },
    blockRegistry: undefined,
    shell: {
      openCommandPalette: (mode, blockId) => opened.push([mode, blockId]),
    },
  })

  runtime.handleSlashKeydown(event)

  assert.equal(event.defaultPrevented, false)
  assert.equal(event.propagationStopped, false)
  assert.deepEqual(opened, [])
})

test('Bear ATX heading spacing preserves imported Markdown source', () => {
  const markdown = '###  Wide title  ####'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'heading',
    level: 3,
    atxTextSpacing: 2,
    atxClosingLength: 4,
    atxClosingSpacing: 2,
    text: 'Wide title',
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentIndex(document).outline.map((entry) => entry.label), ['Wide title'])

  const spacingState = textSelectionState('###  Wide title', 'md-1', 0)
  assert.equal(
    markdownAfter(spacingState, blockShortcutTransaction(spacingState, spacingState.selection.from, spacingState.selection.from, ' ')),
    '###   Wide title',
  )
  assert.equal(markdownAfter(spacingState, backspaceBlockTransaction(spacingState)), '### Wide title')
})

test('Bear heading level changes keep Markdown marker style', () => {
  const atxState = selectedState('###  Wide title  ####', 'md-1')
  const atxTransaction = changeBlockByIdTransaction(atxState, 'md-1', { type: 'heading', level: 2 })

  assert.equal(markdownAfter(atxState, atxTransaction), '##  Wide title  ####')
  assert.deepEqual(blocksAfter(atxState, atxTransaction), [
    {
      id: 'md-1',
      type: 'heading',
      level: 2,
      atxTextSpacing: 2,
      atxClosingLength: 4,
      atxClosingSpacing: 2,
      text: 'Wide title',
      marks: [],
    },
  ])

  const setextState = selectedState('Title\n=====', 'md-1')
  assert.equal(
    markdownAfter(setextState, changeBlockByIdTransaction(setextState, 'md-1', { type: 'heading', level: 2 })),
    'Title\n-----',
  )
  assert.equal(
    markdownAfter(setextState, changeBlockByIdTransaction(setextState, 'md-1', { type: 'heading', level: 3 })),
    '### Title',
  )
})

test('Bear heading markers feel editable through input and backspace', () => {
  const h1State = textSelectionState('# Title', 'md-1', 0)
  assert.equal(
    markdownAfter(h1State, blockShortcutTransaction(h1State, h1State.selection.from, h1State.selection.from, '#')),
    '## Title',
  )

  const h3State = textSelectionState('### Title', 'md-1', 0)
  assert.equal(markdownAfter(h3State, backspaceBlockTransaction(h3State)), '## Title')

  const backToParagraphState = textSelectionState('# Title', 'md-1', 0)
  assert.equal(markdownAfter(backToParagraphState, backspaceBlockTransaction(backToParagraphState)), 'Title')
})

test('Bear repeated heading marker input walks visual heading levels', () => {
  const h1State = textSelectionState('# Title', 'md-1', 0)
  const h2Transaction = blockShortcutTransaction(h1State, h1State.selection.from, h1State.selection.from, '#')
  assert.equal(markdownAfter(h1State, h2Transaction), '## Title')
  assert.deepEqual(blocksAfter(h1State, h2Transaction), [
    { id: 'md-1', type: 'heading', level: 2, text: 'Title', marks: [] },
  ])

  const h2State = h1State.apply(h2Transaction)
  const h3Transaction = blockShortcutTransaction(h2State, h2State.selection.from, h2State.selection.from, '#')
  assert.equal(markdownAfter(h2State, h3Transaction), '### Title')
  assert.deepEqual(blocksAfter(h2State, h3Transaction), [
    { id: 'md-1', type: 'heading', level: 3, text: 'Title', marks: [] },
  ])
})

test('Bear empty heading marker input reacts before Enter', () => {
  const paragraphState = textState('')
  const h1Transaction = blockShortcutTransaction(
    paragraphState,
    paragraphState.selection.from,
    paragraphState.selection.from,
    '#',
  )
  assert.equal(markdownAfter(paragraphState, h1Transaction), '#')
  assert.deepEqual(blocksAfter(paragraphState, h1Transaction)[0], {
    id: 'b1',
    type: 'heading',
    level: 1,
    text: '',
    marks: [],
  })

  const h1State = paragraphState.apply(h1Transaction)
  const h2Transaction = blockShortcutTransaction(
    h1State,
    h1State.selection.from,
    h1State.selection.from,
    '#',
  )
  assert.equal(markdownAfter(h1State, h2Transaction), '##')
  assert.deepEqual(blocksAfter(h1State, h2Transaction)[0], {
    id: 'b1',
    type: 'heading',
    level: 2,
    text: '',
    marks: [],
  })

  const h2State = h1State.apply(h2Transaction)
  const h3Transaction = blockShortcutTransaction(h2State, h2State.selection.from, h2State.selection.from, '#')
  assert.equal(markdownAfter(h2State, h3Transaction), '###')
})

test('Bear empty heading marker input runs through text input before Enter', () => {
  const view = {
    state: textState(''),
    dispatch(transaction) {
      this.state = this.state.apply(transaction)
    },
  }
  const handlers = createNanoInputTextHandlers(
    {
      collapsedBlockIds: new Set(),
      shell: {
        openCommandPalette: () => {
          throw new Error('heading marker input should not open slash palette')
        },
      },
    },
    {
      restoreHistory: () => {},
      runMarkCommand: () => {},
      toggleCollapsedBlock: () => {},
    },
  )

  assert.equal(handlers.handleShortcutInput(view, view.state.selection.from, view.state.selection.from, '#'), true)
  assert.deepEqual(nanoBlocksFromProseMirror(view.state.doc), [
    { id: 'b1', type: 'heading', level: 1, text: '', marks: [] },
  ])
})

test('Bear heading marker input promotes existing paragraph text before Enter', () => {
  const state = textSelectionState('Title', 'md-1', 0)
  const transaction = blockShortcutTransaction(state, state.selection.from, state.selection.from, '#')

  assert.equal(markdownAfter(state, transaction), '# Title')
  assert.deepEqual(blocksAfter(state, transaction), [
    { id: 'md-1', type: 'heading', level: 1, text: 'Title', marks: [] },
  ])

  const nextState = state.apply(transaction)
  const h2Transaction = blockShortcutTransaction(nextState, nextState.selection.from, nextState.selection.from, '#')
  assert.equal(markdownAfter(nextState, h2Transaction), '## Title')
  assert.deepEqual(blocksAfter(nextState, h2Transaction), [
    { id: 'md-1', type: 'heading', level: 2, text: 'Title', marks: [] },
  ])
})

test('Bear heading prefix marker space does not leak into existing text', () => {
  const h1State = typeShortcutText(textSelectionState('Title', 'md-1', 0), '# ')
  assert.equal(markdownFromState(h1State), '# Title')
  assert.deepEqual(nanoBlocksFromProseMirror(h1State.doc), [
    { id: 'md-1', type: 'heading', level: 1, text: 'Title', marks: [] },
  ])

  const h2State = typeShortcutText(textSelectionState('Title', 'md-1', 0), '## ')
  assert.equal(markdownFromState(h2State), '## Title')
  assert.deepEqual(nanoBlocksFromProseMirror(h2State.doc), [
    { id: 'md-1', type: 'heading', level: 2, text: 'Title', marks: [] },
  ])

  const emptyState = typeShortcutText(textState(''), '# ')
  assert.equal(markdownFromState(emptyState), '#')
  assert.deepEqual(nanoBlocksFromProseMirror(emptyState.doc), [
    { id: 'b1', type: 'heading', level: 1, text: '', marks: [] },
  ])
})

test('Bear heading marker input at h6 does not leak literal marker text', () => {
  const state = textSelectionState('###### Title', 'md-1', 0)
  assert.equal(
    markdownAfter(state, blockShortcutTransaction(state, state.selection.from, state.selection.from, '#')),
    '###### Title',
  )
})

test('Bear active block changes keep Markdown marker style', () => {
  const headingState = selectedState('###  Wide title  ####', 'md-1')
  assert.equal(
    markdownAfter(headingState, changeActiveBlockTransaction(headingState, { type: 'heading', level: 1 })),
    '#  Wide title  ####',
  )

  const bulletState = selectedState('\t+ task\n\t  detail', 'md-1')
  assert.equal(
    markdownAfter(bulletState, changeActiveBlockTransaction(bulletState, { type: 'todo', checked: false })),
    '\t+ [ ] task\n\t  detail',
  )

  const todoState = selectedState('+ [X] task\n  detail', 'md-1')
  assert.equal(
    markdownAfter(todoState, changeActiveBlockTransaction(todoState, { type: 'list_item', kind: 'bullet' })),
    '+ task\n  detail',
  )
})
