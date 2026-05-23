import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Standalone attachment blocks preserve explicit angle destinations', () => {
  const markdown = '[Readme](<docs/readme.md> "Readme")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    {
      id: 'md-1',
      type: 'attachment',
      src: 'docs/readme.md',
      label: 'Readme',
      title: 'Readme',
      destinationStyle: 'angle',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).attachments.some((entry) => entry.label === 'Readme' && entry.target === 'docs/readme.md'))

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'attachment',
      src: 'docs/readme.md',
      label: 'Readme',
      title: 'Readme',
      destinationStyle: 'angle',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})

test('Bear special searches narrow block index candidates', () => {
  const markdown = [
    '# Home',
    '',
    '- [ ] Todo #work',
    '',
    '- [x] Done',
    '',
    '![Cover](assets/cover.png)',
    '',
    '[Project brief](files/brief.pdf)',
    '',
    '[[Home]]',
    '',
    '| A | B |',
    '| --- | --- |',
    '| [[Home]] | #work |',
    '',
    '$$',
    'E=mc^2',
    '$$',
    '',
    '```js',
    'console.log("bear")',
    '```',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(nanoDocumentSearch(document, '@todo')?.blockIds, ['md-2'])
  assert.deepEqual(nanoDocumentSearch(document, '@done')?.blockIds, ['md-3'])
  assert.deepEqual(nanoDocumentSearch(document, '@task')?.blockIds, ['md-2', 'md-3'])
  assert.deepEqual(nanoDocumentSearch(document, '@title Home')?.blockIds, ['md-1'])
  assert.deepEqual(nanoDocumentSearch(document, '@images')?.blockIds, ['md-4'])
  assert.deepEqual(nanoDocumentSearch(document, '@files')?.blockIds, ['md-5'])
  assert.deepEqual(nanoDocumentSearch(document, '@attachments')?.blockIds, ['md-4', 'md-5'])
  assert.deepEqual(nanoDocumentSearch(document, '@wikilinks')?.blockIds, ['md-6', 'md-7'])
  assert.deepEqual(nanoDocumentSearch(document, '@backlinks')?.blockIds, ['md-6', 'md-7'])
  assert.deepEqual(nanoDocumentSearch(document, '@tables')?.blockIds, ['md-7'])
  assert.deepEqual(nanoDocumentSearch(document, '@math')?.blockIds, ['md-8'])
  assert.deepEqual(nanoDocumentSearch(document, '@code')?.blockIds, ['md-9'])
  assert.deepEqual(nanoDocumentSearch(document, '@todo work')?.blockIds, ['md-2'])
  assert.deepEqual(nanoDocumentSearch(document, '@제목 Home')?.blockIds, ['md-1'])
  assert.deepEqual(nanoDocumentSearch(document, '@해야할일 work')?.blockIds, ['md-2'])
  assert.deepEqual(nanoDocumentSearch(document, '@첨부파일')?.blockIds, ['md-4', 'md-5'])
  assert.deepEqual(nanoDocumentSearch(document, '@역방향링크')?.blockIds, ['md-6', 'md-7'])
  assert.equal(nanoDocumentSearch(document, '   '), null)
})
