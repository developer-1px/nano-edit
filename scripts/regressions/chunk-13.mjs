import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear images preserve Markdown title text', () => {
  const markdown = '![note image](assets/note.png "Pinned note")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'image')
  assert.equal(document.blocks[0].src, 'assets/note.png')
  assert.equal(document.blocks[0].alt, 'note image')
  assert.equal(document.blocks[0].title, 'Pinned note')
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'image',
      src: 'assets/note.png',
      alt: 'note image',
      title: 'Pinned note',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})

test('Bear images preserve angle destinations with spaces and parentheses', () => {
  const markdown = '![phase](<assets/phase (1).png> "Phase (1)")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'image')
  assert.equal(document.blocks[0].src, 'assets/phase (1).png')
  assert.equal(document.blocks[0].alt, 'phase')
  assert.equal(document.blocks[0].title, 'Phase (1)')
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'image',
      src: 'assets/phase (1).png',
      alt: 'phase',
      title: 'Phase (1)',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})

test('Bear images preserve explicit angle destination spelling', () => {
  const markdown = '![logo](<https://example.com/logo.png>)'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'image',
    src: 'https://example.com/logo.png',
    alt: 'logo',
    destinationStyle: 'angle',
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'image',
      src: 'https://example.com/logo.png',
      alt: 'logo',
      destinationStyle: 'angle',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})

