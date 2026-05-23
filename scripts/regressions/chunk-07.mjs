import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Markdown link actions resolve titled and angle-wrapped destinations', () => {
  assert.equal(
    externalHrefFromMarkdownLink('[site](https://example.com "Example Site")'),
    'https://example.com',
  )
  assert.equal(
    externalHrefFromMarkdownLink('[Project brief](<files/project brief.pdf> "PDF")'),
    'files/project%20brief.pdf',
  )
  assert.equal(externalHrefFromMarkdownLink('[broken](files/project brief.pdf)'), null)
  assert.equal(externalHrefFromMarkdownLink('[mail](mailto:editor@example.com)'), 'mailto:editor@example.com')
  assert.equal(externalHrefFromMarkdownLink('[section](#release-notes)'), '#release-notes')
  assert.equal(externalHrefFromMarkdownLink('[blocked](javascript:alert(1))'), null)
  assert.equal(externalHrefFromMarkdownLink('[blocked](<data:text/html,alert(1)>)'), null)
  assert.equal(externalHrefFromMarkdownLink('[blocked](file:///private/etc/passwd)'), null)
})

test('Bear Markdown links preserve balanced parentheses and angle destinations', () => {
  const markdown = 'See [release](https://example.com/a_(b) "Release (B)") and [brief](<files/project brief.pdf>)'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'paragraph',
    text: 'See release and brief',
    marks: [
      { type: 'link', from: 4, to: 11, href: 'https://example.com/a_(b)', title: 'Release (B)' },
      { type: 'link', from: 16, to: 21, href: 'files/project brief.pdf' },
    ],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear Markdown links preserve explicit angle destination spelling', () => {
  const markdown = 'Visit [site](<https://example.com>) and [doc](<docs/readme.md> "Readme")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'paragraph',
    text: 'Visit site and doc',
    marks: [
      { type: 'link', from: 6, to: 10, href: 'https://example.com', destinationStyle: 'angle' },
      { type: 'link', from: 15, to: 18, href: 'docs/readme.md', title: 'Readme', destinationStyle: 'angle' },
    ],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})
