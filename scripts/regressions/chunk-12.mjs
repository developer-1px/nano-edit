import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear table row outer pipes preserve imported Markdown source', () => {
  const markdown = [
    'Plain | Center | Right',
    '| --- | :---: | ---: |',
    '| a | b | c |',
    'd | e | f',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'table')
  assert.equal(document.blocks[0].leadingPipe, false)
  assert.equal(document.blocks[0].trailingPipe, false)
  assert.deepEqual(document.blocks[0].leadingPipes, [false, true, true, false])
  assert.deepEqual(document.blocks[0].trailingPipes, [false, true, true, false])
  assert.deepEqual(document.blocks[0].align, [null, 'center', 'right'])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const state = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(state, changeBlockByIdTransaction(state, 'md-1', { type: 'table' })),
    markdown,
  )
})

test('Bear table cells keep escaped pipes, code pipes, and raw escapes', () => {
  const markdown = [
    '| Literal | Code | Escaped |',
    '| --- | --- | --- |',
    '| a\\|b | `x | y` | \\#not-a-tag |',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'table',
    rows: [
      ['Literal', 'Code', 'Escaped'],
      ['a|b', '`x | y`', '\\#not-a-tag'],
    ],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear table rows do not mistake escaped final pipes for outer pipes', () => {
  const markdown = [
    'Name | Value\\|',
    '--- | ---',
    'a | b\\|',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'table',
    rows: [
      ['Name', 'Value|'],
      ['a', 'b|'],
    ],
    leadingPipe: false,
    trailingPipe: false,
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})


