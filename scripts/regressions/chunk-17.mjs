import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear nested quote markers stay structural block syntax', () => {
  const markdown = '>> nested\n>>> deep\n>>'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'quote',
    text: 'nested\ndeep\n',
    quoteMarkerSpacing: ['space', 'space', 'none'],
    quoteMarkerDepths: [2, 3, 2],
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('>> nested')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'quote', quoteMarkerSpacing: ['space'], quoteMarkerDepths: [2], text: 'nested', marks: [] },
    { id: 'b1-2', type: 'quote', quoteMarkerSpacing: ['space'], quoteMarkerDepths: [2], text: '', marks: [] },
  ])

  const changeState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'callout', tone: 'tip' })),
    '>> [!TIP] nested\n>>> deep\n>>',
  )
})

test('Bear quote markers feel editable through input and backspace', () => {
  const quoteState = textSelectionState('> nested', 'md-1', 0)
  assert.equal(
    markdownAfter(quoteState, blockShortcutTransaction(quoteState, quoteState.selection.from, quoteState.selection.from, '>')),
    '>> nested',
  )

  const nestedState = textSelectionState('>> nested', 'md-1', 0)
  assert.equal(markdownAfter(nestedState, backspaceBlockTransaction(nestedState)), '> nested')

  const plainQuoteState = textSelectionState('> nested', 'md-1', 0)
  assert.equal(markdownAfter(plainQuoteState, backspaceBlockTransaction(plainQuoteState)), 'nested')
})

test('Bear continuation quote markers feel editable through input and backspace', () => {
  const nestedSecondLineState = textSelectionState('> one\n>> two', 'md-1', 'one\n'.length)
  assert.equal(
    markdownAfter(nestedSecondLineState, blockShortcutTransaction(nestedSecondLineState, nestedSecondLineState.selection.from, nestedSecondLineState.selection.from, '>')),
    '> one\n>>> two',
  )
  assert.equal(markdownAfter(nestedSecondLineState, backspaceBlockTransaction(nestedSecondLineState)), '> one\n> two')

  const plainSecondLineState = textSelectionState('> one\n> two', 'md-1', 'one\n'.length)
  assert.equal(markdownAfter(plainSecondLineState, backspaceBlockTransaction(plainSecondLineState)), '> one\n\ntwo')
})

test('Bear enter splits multiline quote marker attrs by source line', () => {
  const state = textSelectionState('>one\n> two\n>>three', 'md-1', 'one'.length)
  const transaction = enterBlockTransaction(state)

  assert.equal(markdownAfter(state, transaction), '>one\n\n> two\n>>three')
  assert.deepEqual(blocksAfter(state, transaction), [
    { id: 'md-1', type: 'quote', quoteMarkerSpacing: ['none'], text: 'one', marks: [] },
    { id: 'md-1-2', type: 'quote', quoteMarkerSpacing: ['space', 'none'], quoteMarkerDepths: [1, 2], text: 'two\nthree', marks: [] },
  ])
})

test('Bear ATX heading closing markers stay structural syntax', () => {
  const markdown = '## Closed title ###\n\n# Plain'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'heading'
      ? { level: block.level, text: block.text, atxClosingLength: block.atxClosingLength ?? null }
      : null,
  ), [
    { level: 2, text: 'Closed title', atxClosingLength: 3 },
    { level: 1, text: 'Plain', atxClosingLength: null },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentIndex(document).outline.map((entry) => entry.label), ['Closed title', 'Plain'])
})
