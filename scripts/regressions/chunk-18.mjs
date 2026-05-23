import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

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
