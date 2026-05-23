import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear URL autolinks preserve raw link syntax', () => {
  const markdown = 'Visit <https://example.com> and https://bear.app/path.'
  const document = nanoDocumentFromMarkdown(markdown)
  const autoFrom = markdown.indexOf('<https')
  const bareFrom = markdown.indexOf('https://bear')

  assert.deepEqual(document.blocks[0].marks, [
    {
      type: 'link',
      from: autoFrom,
      to: autoFrom + '<https://example.com>'.length,
      href: 'https://example.com',
      syntax: 'autolink',
    },
    {
      type: 'link',
      from: bareFrom,
      to: bareFrom + 'https://bear.app/path'.length,
      href: 'https://bear.app/path',
      syntax: 'bare',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(blockAfterMarkShortcut('<https://example.com', '>').marks, [
    { type: 'link', from: 0, to: 21, href: 'https://example.com', syntax: 'autolink' },
  ])
  assert.deepEqual(blockAfterMarkShortcut('see https://example.com', ' ').marks, [
    { type: 'link', from: 4, to: 23, href: 'https://example.com', syntax: 'bare' },
  ])
  assert.deepEqual(rawMarkdownInlineDomSpec('cell <https://example.com> https://bear.app'), [
    'cell ',
    [
      'span',
      {
        class: 'nano-raw-link',
        'data-href': 'https://example.com',
        'data-syntax': 'autolink',
        title: 'https://example.com',
      },
      'https://example.com',
    ],
    ' ',
    [
      'span',
      {
        class: 'nano-raw-link',
        'data-href': 'https://bear.app',
        'data-syntax': 'bare',
        title: 'https://bear.app',
      },
      'https://bear.app',
    ],
  ])
  assert(nanoDocumentIndex(document).externalLinks.some((entry) => entry.label === 'https://example.com' && entry.target === 'https://example.com'))
  assert(nanoDocumentIndex(document).externalLinks.some((entry) => entry.label === 'https://bear.app/path' && entry.target === 'https://bear.app/path'))
})

test('Standalone URLs become Notion-style bookmark blocks without losing Markdown syntax', () => {
  const markdown = '<https://example.com>\n\nhttps://bear.app/path'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    { id: 'md-1', type: 'bookmark', href: 'https://example.com', syntax: 'autolink' },
    { id: 'md-2', type: 'bookmark', href: 'https://bear.app/path' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).bookmarks.some((entry) => entry.label === 'example.com' && entry.target === 'https://example.com'))
  assert(nanoDocumentIndex(document).bookmarks.some((entry) => entry.label === 'bear.app' && entry.target === 'https://bear.app/path'))

  const shortcutState = textState('https://bear.app/path')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'bookmark', href: 'https://bear.app/path' },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])

  const sourceState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(sourceState, markdownBlockSourceTransaction(sourceState, 'md-1', '[Bear](https://bear.app "Bear Home")')),
    '[Bear](https://bear.app "Bear Home")\n\nhttps://bear.app/path',
  )
})
