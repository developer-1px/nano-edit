import * as h from './harness.mjs'
import { externalUrlTokensInText } from '../../src/inline-tokens/index.ts'
const { inlineMarkdownFixture, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Markdown URL autolinks preserve raw link syntax', () => {
  const markdown = 'Visit <https://example.com> and https://example.org/path.'
  const document = nanoDocumentFromMarkdown(markdown)
  const autoFrom = markdown.indexOf('<https')
  const bareFrom = markdown.indexOf('https://example.org')

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
      to: bareFrom + 'https://example.org/path'.length,
      href: 'https://example.org/path',
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
  assert.deepEqual(rawMarkdownInlineDomSpec('cell <https://example.com> https://example.org'), [
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
        'data-href': 'https://example.org',
        'data-syntax': 'bare',
        title: 'https://example.org',
      },
      'https://example.org',
    ],
  ])
  assert(nanoDocumentIndex(document).externalLinks.some((entry) => entry.label === 'https://example.com' && entry.target === 'https://example.com'))
  assert(nanoDocumentIndex(document).externalLinks.some((entry) => entry.label === 'https://example.org/path' && entry.target === 'https://example.org/path'))
})

test('Bare URL tokens preserve balanced parenthetical suffixes', () => {
  const markdown = 'See https://example.com/a(b)/c. Then (https://example.com/wrapped).'
  const document = nanoDocumentFromMarkdown(markdown)
  const tokens = externalUrlTokensInText(markdown)

  assert.deepEqual(tokens.map((token) => token.href), [
    'https://example.com/a(b)/c',
    'https://example.com/wrapped',
  ])
  assert.deepEqual(document.blocks[0].marks.map((mark) => mark.href), [
    'https://example.com/a(b)/c',
    'https://example.com/wrapped',
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
})

test('Standalone URLs become bookmark blocks without losing Markdown syntax', () => {
  const markdown = '<https://example.com>\n\nhttps://example.org/path'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    { id: 'md-1', type: 'bookmark', href: 'https://example.com', syntax: 'autolink' },
    { id: 'md-2', type: 'bookmark', href: 'https://example.org/path' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).bookmarks.some((entry) => entry.label === 'example.com' && entry.target === 'https://example.com'))
  assert(nanoDocumentIndex(document).bookmarks.some((entry) => entry.label === 'example.org' && entry.target === 'https://example.org/path'))

  const shortcutState = textState('https://example.org/path')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'bookmark', href: 'https://example.org/path' },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])

  const sourceState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(sourceState, markdownBlockSourceTransaction(sourceState, 'md-1', '[Example](https://example.org "Example Home")')),
    '[Example](https://example.org "Example Home")\n\nhttps://example.org/path',
  )
})
