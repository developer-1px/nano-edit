import * as h from './harness.mjs'
const { assert, nanoDocumentIndex, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockEnterShortcutTransaction, nanoBlocksFromProseMirror, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, blockAfterMarkShortcut, blocksAfter } = h

test('Bear footnotes keep refs and definitions as Markdown-visible structure', () => {
  const markdown = 'Footnote ref[^1]\n\n[^1]: **detail**'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0].marks, [
    { type: 'footnote_ref', from: 12, to: 16, name: '1' },
  ])
  assert.deepEqual(document.blocks[1], {
    id: 'md-2',
    type: 'footnote',
    name: '1',
    text: 'detail',
    marks: [{ type: 'bold', from: 0, to: 6 }],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(blockAfterMarkShortcut('ref[^1', ']').marks, [
    { type: 'footnote_ref', from: 3, to: 7, name: '1' },
  ])
  assert.deepEqual(rawMarkdownInlineDomSpec('cell [^1]'), [
    'cell ',
    [
      'span',
      { class: 'nano-raw-footnote-ref', 'data-name': '1', title: '1' },
      '1',
    ],
  ])
  assert(nanoDocumentIndex(document).footnotes.some((entry) => entry.target === '[^1]'))

  const shortcutState = textState('[^note]: body')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'footnote', name: 'note', text: 'body', marks: [] },
    { id: 'b1-2', type: 'paragraph', text: '', marks: [] },
  ])
})
