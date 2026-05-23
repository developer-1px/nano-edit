import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Standalone Bear tags can become tag reference blocks', () => {
  const markdown = '#projects/editor\n\n#multi word tag#'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    { id: 'md-1', type: 'tag_ref', name: 'projects/editor' },
    { id: 'md-2', type: 'tag_ref', name: 'multi word tag' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).tags.some((entry) => entry.label === 'projects/editor' && entry.target === '#projects/editor'))
  assert(nanoDocumentIndex(document).tags.some((entry) => entry.label === 'multi word tag' && entry.target === '#multi word tag#'))

  const shortcutState = textState('#multi word tag#')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'tag_ref', name: 'multi word tag' },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})

test('Bear math keeps inline and block formulas as Markdown-visible structure', () => {
  const inline = 'Inline math $E=mc^2$'
  const inlineDocument = nanoDocumentFromMarkdown(inline)

  assert.deepEqual(inlineDocument.blocks[0].marks, [
    { type: 'math', from: 12, to: 20, formula: 'E=mc^2' },
  ])
  assert.equal(nanoMarkdownFromDocument(inlineDocument), inline)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(inlineDocument)) }), inline)
  assert.deepEqual(blockAfterMarkShortcut('$E=mc^2', '$').marks, [
    { type: 'math', from: 0, to: 8, formula: 'E=mc^2' },
  ])
  assert.deepEqual(rawMarkdownInlineDomSpec('cell $E=mc^2$'), [
    'cell ',
    [
      'span',
      {
        class: 'nano-raw-math',
        'data-formula': 'E=mc^2',
        title: 'E=mc^2',
      },
      'E=mc^2',
    ],
  ])
  assert(nanoDocumentIndex(inlineDocument).math.some((entry) => entry.label === 'E=mc^2'))

  const block = '$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$'
  const blockDocument = nanoDocumentFromMarkdown(block)
  assert.deepEqual(blockDocument.blocks[0], {
    id: 'md-1',
    type: 'math',
    text: '\\int_0^1 x^2 dx = \\frac{1}{3}',
  })
  assert.equal(nanoMarkdownFromDocument(blockDocument), block)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(blockDocument)) }), block)

  const singleLineBlock = '$$E=mc^2$$'
  const singleLineBlockDocument = nanoDocumentFromMarkdown(singleLineBlock)
  assert.deepEqual(singleLineBlockDocument.blocks[0], {
    id: 'md-1',
    type: 'math',
    text: 'E=mc^2',
    mathStyle: 'single',
  })
  assert.equal(nanoMarkdownFromDocument(singleLineBlockDocument), singleLineBlock)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(singleLineBlockDocument)) }), singleLineBlock)

  const shortcutState = textState('$$E=mc^2$$')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'math', text: 'E=mc^2', mathStyle: 'single' },
  ])
})
