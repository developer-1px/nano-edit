import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear code fence opener spacing preserves imported Markdown source', () => {
  const markdown = '  ~~~~ js\nconst ticks = "```"\n  ~~~~'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'code',
    text: 'const ticks = "```"',
    language: 'js',
    fenceMarker: '~',
    fenceLength: 4,
    fenceIndent: '  ',
    fenceInfoSpacing: ' ',
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const state = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(state, changeBlockByIdTransaction(state, 'md-1', { type: 'code', language: 'ts' })),
    '  ~~~~ ts\nconst ticks = "```"\n  ~~~~',
  )
})

test('Bear code block changes keep fence marker style', () => {
  const state = selectedState('~~~~js\nconst ticks = "```"\n~~~~', 'md-1')

  assert.equal(
    markdownAfter(state, changeBlockByIdTransaction(state, 'md-1', { type: 'code' })),
    '~~~~js\nconst ticks = "```"\n~~~~',
  )
  assert.equal(
    markdownAfter(state, changeBlockByIdTransaction(state, 'md-1', { type: 'code', language: 'ts' })),
    '~~~~ts\nconst ticks = "```"\n~~~~',
  )
})

test('Bear divider markers preserve imported Markdown source', () => {
  const markdown = '******\n\n_____\n\n---'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'divider'
      ? { marker: block.marker ?? '---', markerLength: block.markerLength ?? 3 }
      : null,
  ), [
    { marker: '***', markerLength: 6 },
    { marker: '___', markerLength: 5 },
    { marker: '---', markerLength: 3 },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentSearch(document, '******')?.blockIds, ['md-1'])

  const shortcutState = textState('____')
  const shortcut = blockShortcutTransaction(shortcutState, shortcutState.selection.from, shortcutState.selection.from, '_')
  assert.deepEqual(blocksAfter(shortcutState, shortcut), [
    { id: 'b1', type: 'divider', marker: '___', markerLength: 5 },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])

  const changeState = selectedState('******', 'md-1')
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'divider' })),
    '******',
  )
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'divider', marker: '___', markerLength: 5 })),
    '_____',
  )
})


