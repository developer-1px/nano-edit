import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear enter splits callout continuation lines as Markdown quotes', () => {
  const state = textSelectionState('>[!TIP]dense\n> spaced\n>bare', 'md-1', 'dense'.length)
  const transaction = enterBlockTransaction(state)

  assert.equal(markdownAfter(state, transaction), '>[!TIP]dense\n\n> spaced\n>bare')
  assert.deepEqual(blocksAfter(state, transaction), [
    { id: 'md-1', type: 'callout', tone: 'tip', calloutMarkerSpacing: ['none'], calloutTextSpacing: 'none', text: 'dense', marks: [] },
    { id: 'md-1-2', type: 'quote', quoteMarkerSpacing: ['space', 'none'], text: 'spaced\nbare', marks: [] },
  ])
})

test('Bear empty heading and quote markers stay structural blocks', () => {
  const markdown = '#\n\n## named\n\n>\n> quoted'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) => {
    if (block.type === 'heading') return { type: block.type, level: block.level, text: block.text }
    if (block.type === 'quote') return { type: block.type, text: block.text }
    return null
  }), [
    { type: 'heading', level: 1, text: '' },
    { type: 'heading', level: 2, text: 'named' },
    { type: 'quote', text: '\nquoted' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear quote marker spacing preserves imported Markdown source', () => {
  const markdown = '>no space\n> spaced\n>'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'quote',
    text: 'no space\nspaced\n',
    quoteMarkerSpacing: ['none', 'space', 'none'],
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('>no space')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'quote', quoteMarkerSpacing: ['none'], text: 'no space', marks: [] },
    { id: 'b1-2', type: 'quote', quoteMarkerSpacing: ['none'], text: '', marks: [] },
  ])

  const changeState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(changeState, changeBlockByIdTransaction(changeState, 'md-1', { type: 'quote' })),
    markdown,
  )
})


