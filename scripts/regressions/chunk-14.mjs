import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear underscore bold and italic delimiters preserve imported Markdown source', () => {
  const document = nanoDocumentFromMarkdown('__bold__ _italic_')
  const block = document.blocks[0]

  assert.deepEqual(block.marks, [
    { type: 'bold', from: 0, to: 4, marker: '__' },
    { type: 'italic', from: 5, to: 11, marker: '_' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), '__bold__ _italic_')
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), '__bold__ _italic_')
})

test('Bear inline code spans preserve multi-backtick Markdown source', () => {
  const markdown = 'Use ``const x = `tick`;`` now'
  const document = nanoDocumentFromMarkdown(markdown)
  const block = document.blocks[0]

  assert.equal(block.text, 'Use const x = `tick`; now')
  assert.deepEqual(block.marks, [
    { type: 'code', from: 4, to: 21, backtickLength: 2 },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.equal(nanoMarkdownFromDocument({
    blocks: [{ id: 'b1', type: 'paragraph', text: 'a ` b', marks: [{ type: 'code', from: 0, to: 5 }] }],
  }), '``a ` b``')
})

test('Bear callout tones round-trip through Markdown and ProseMirror', () => {
  const markdown = [
    '> [!NOTE] note',
    '',
    '> [!TIP] tip',
    '',
    '> [!IMPORTANT] important',
    '',
    '> [!WARNING] warning',
    '',
    '> [!CAUTION] caution',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) => block.type === 'callout' ? block.tone : null), [
    'note',
    'tip',
    'important',
    'warning',
    'caution',
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.deepEqual(nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)).map((block) =>
    block.type === 'callout' ? block.tone : null,
  ), [
    'note',
    'tip',
    'important',
    'warning',
    'caution',
  ])
})


