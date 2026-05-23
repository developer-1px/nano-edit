import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear inline Markdown round-trips through the block model', () => {
  const document = nanoDocumentFromMarkdown(bearInlineMarkdown)
  assert.equal(nanoMarkdownFromDocument(document), bearInlineMarkdown)

  const block = document.blocks[0]
  assert.equal(block.type, 'paragraph')
  assert.deepEqual(block.marks.map((mark) => mark.type), [
    'bold',
    'italic',
    'underline',
    'strike',
    'highlight',
    'code',
    'tag',
    'tag',
    'note_link',
    'link',
  ])
  assert.equal(block.marks.find((mark) => mark.type === 'note_link')?.target, 'Block UI#Markdown Source')
  assert.equal(block.marks.find((mark) => mark.type === 'note_link')?.alias, 'raw 편집')
  assert.equal(block.marks.find((mark) => mark.type === 'link')?.href, 'https://example.com')
  assert(nanoDocumentIndex(document).tags.some((entry) => entry.label === 'multi word tag' && entry.target === '#multi word tag#'))
})

test('Bear note links preserve aliases as structured mark data', () => {
  const markdown = 'Open [[Target Note#Heading|display alias]]'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0].marks, [
    { type: 'note_link', from: 5, to: markdown.length, target: 'Target Note#Heading', alias: 'display alias' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(blockAfterMarkShortcut('[[Target Note|alias', ']]').marks, [
    { type: 'note_link', from: 0, to: 21, target: 'Target Note', alias: 'alias' },
  ])
  assert.deepEqual(rawMarkdownInlineDomSpec('cell [[Target Note|alias]]'), [
    'cell ',
    [
      'span',
      {
        class: 'nano-raw-note-link',
        'data-target': 'Target Note',
        'data-alias': 'alias',
        title: 'alias',
      },
      'alias',
    ],
  ])
})

test('Standalone Bear note links can become note reference blocks', () => {
  const markdown = '[[Target Note#Heading|display alias]]'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    {
      id: 'md-1',
      type: 'note_ref',
      target: 'Target Note#Heading',
      alias: 'display alias',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).noteLinks.some((entry) => entry.label === 'display alias' && entry.target === '[[Target Note#Heading]]'))

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'note_ref',
      target: 'Target Note#Heading',
      alias: 'display alias',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})
