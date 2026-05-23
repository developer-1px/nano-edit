import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear marker-only callouts keep the marker line clean', () => {
  const markdown = '> [!TIP]\n> This is callout content'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'callout')
  assert.equal(document.blocks[0].tone, 'tip')
  assert.equal(document.blocks[0].text, '\nThis is callout content')
  assert.equal(nanoMarkdownFromDocument(document), markdown)
})

test('Bear callout marker spacing preserves imported Markdown source', () => {
  const markdown = '>[!TIP]dense\n> spaced\n>bare'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'callout',
    tone: 'tip',
    calloutMarkerSpacing: ['none', 'space', 'none'],
    calloutTextSpacing: 'none',
    text: 'dense\nspaced\nbare',
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentIndex(document).callouts.map((entry) => entry.label), ['Tip: dense'])

  const shortcutState = textState('>[!TIP]dense')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'callout', tone: 'tip', calloutMarkerSpacing: ['none'], calloutTextSpacing: 'none', text: 'dense', marks: [] },
    { id: 'b1-2', type: 'paragraph', text: '', marks: [] },
  ])

  const spacedShortcutState = textState('> [!TIP] head')
  assert.deepEqual(blocksAfter(spacedShortcutState, blockEnterShortcutTransaction(spacedShortcutState)), [
    { id: 'b1', type: 'callout', tone: 'tip', calloutMarkerSpacing: ['space'], calloutTextSpacing: 'space', text: 'head', marks: [] },
    { id: 'b1-2', type: 'paragraph', text: '', marks: [] },
  ])

  const changeState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'callout', tone: 'warning' })),
    '>[!WARNING]dense\n> spaced\n>bare',
  )
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'quote' })),
    '>dense\n> spaced\n>bare',
  )
})

test('Bear callout continuation quote depth preserves imported Markdown source', () => {
  const markdown = '> [!TIP] head\n>> nested'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'callout',
    tone: 'tip',
    calloutMarkerSpacing: ['space', 'space'],
    calloutMarkerDepths: [1, 2],
    calloutTextSpacing: 'space',
    text: 'head\nnested',
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('>> [!TIP] nested')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'callout', tone: 'tip', calloutMarkerSpacing: ['space'], calloutMarkerDepths: [2], calloutTextSpacing: 'space', text: 'nested', marks: [] },
    { id: 'b1-2', type: 'paragraph', text: '', marks: [] },
  ])

  const state = textSelectionState(markdown, 'md-1', 'head'.length)
  const transaction = enterBlockTransaction(state)
  assert.equal(markdownAfter(state, transaction), '> [!TIP] head\n\n>> nested')
  assert.deepEqual(blocksAfter(state, transaction), [
    { id: 'md-1', type: 'callout', tone: 'tip', calloutMarkerSpacing: ['space'], calloutTextSpacing: 'space', text: 'head', marks: [] },
    { id: 'md-1-2', type: 'quote', quoteMarkerSpacing: ['space'], quoteMarkerDepths: [2], text: 'nested', marks: [] },
  ])

  const changeState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'quote' })),
    '> head\n>> nested',
  )
})

test('Bear callout markers feel editable through input and backspace', () => {
  const calloutState = textSelectionState('> [!TIP] nested', 'md-1', 0)
  assert.equal(
    markdownAfter(calloutState, blockShortcutTransaction(calloutState, calloutState.selection.from, calloutState.selection.from, '>')),
    '>> [!TIP] nested',
  )

  const nestedState = textSelectionState('>> [!TIP] nested', 'md-1', 0)
  assert.equal(markdownAfter(nestedState, backspaceBlockTransaction(nestedState)), '> [!TIP] nested')

  const markerState = textSelectionState('> [!TIP] nested', 'md-1', 0)
  assert.equal(markdownAfter(markerState, backspaceBlockTransaction(markerState)), '> nested')
})

test('Bear continuation callout markers feel editable through input and backspace', () => {
  const nestedSecondLineState = textSelectionState('> [!TIP] one\n>> two', 'md-1', 'one\n'.length)
  assert.equal(
    markdownAfter(nestedSecondLineState, blockShortcutTransaction(nestedSecondLineState, nestedSecondLineState.selection.from, nestedSecondLineState.selection.from, '>')),
    '> [!TIP] one\n>>> two',
  )
  assert.equal(markdownAfter(nestedSecondLineState, backspaceBlockTransaction(nestedSecondLineState)), '> [!TIP] one\n> two')

  const plainSecondLineState = textSelectionState('> [!TIP] one\n> two', 'md-1', 'one\n'.length)
  assert.equal(markdownAfter(plainSecondLineState, backspaceBlockTransaction(plainSecondLineState)), '> [!TIP] one\n\ntwo')
})

test('Bear typed callout marker inside a quote becomes callout structure', () => {
  const doc = prosemirrorDocFromNano({
    blocks: [{ id: 'b1', type: 'quote', quoteMarkerSpacing: ['space'], text: '[!TIP]draft', marks: [] }],
  })
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 7),
  })

  assert.equal(
    markdownAfter(state, blockShortcutTransaction(state, state.selection.from, state.selection.from, ' ')),
    '> [!TIP] draft',
  )
})
