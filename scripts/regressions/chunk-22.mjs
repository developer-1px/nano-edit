import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear todo continuation indentation preserves imported Markdown source', () => {
  const markdown = '- [ ] task\n  detail'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'todo',
    checked: false,
    continuationIndents: ['  '],
    indent: 0,
    text: 'task\ndetail',
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear indent commands move list continuation indentation with the block', () => {
  const state = selectedState('- parent\n- [ ] task\n  detail\n- sibling', 'md-2')
  const indented = indentActiveBlockTransaction(state, 'in')

  assert.equal(markdownAfter(state, indented), '- parent\n  - [ ] task\n    detail\n- sibling')
  assert.equal(markdownAfter(state.apply(indented), indentActiveBlockTransaction(state.apply(indented), 'out')), '- parent\n- [ ] task\n  detail\n- sibling')
})

test('Bear indent rejects orphan first list blocks', () => {
  const firstState = selectedState('- first\n- second', 'md-1')

  assert.equal(canIndentActiveBlock(firstState, 'in'), false)
  assert.equal(indentActiveBlockTransaction(firstState, 'in'), null)

  const secondState = selectedState('- first\n- second', 'md-2')
  assert.equal(canIndentActiveBlock(secondState, 'in'), true)
  assert.equal(markdownAfter(secondState, indentActiveBlockTransaction(secondState, 'in')), '- first\n  - second')
})


