import * as h from './harness.mjs'
const { assert, nanoDocumentIndex, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockEnterShortcutTransaction, nanoBlocksFromProseMirror, prosemirrorDocFromNano, test, textState, blocksAfter } = h

test('Standalone Markdown links can become bookmark blocks with label and title', () => {
  const markdown = '[Example](https://example.org "Example Home")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    {
      id: 'md-1',
      type: 'bookmark',
      href: 'https://example.org',
      label: 'Example',
      title: 'Example Home',
      syntax: 'markdown',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).bookmarks.some((entry) => entry.label === 'Example' && entry.target === 'https://example.org'))

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'bookmark',
      href: 'https://example.org',
      label: 'Example',
      title: 'Example Home',
      syntax: 'markdown',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})
