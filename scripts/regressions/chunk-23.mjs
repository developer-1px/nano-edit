import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear selected list blocks indent together with Markdown syntax', () => {
  const markdown = '- [ ] task\n  detail\n+ item\n  more'
  const state = allSelectedState(markdown)
  const indented = indentActiveBlockTransaction(state, 'in')

  assert.equal(markdownAfter(state, indented), '  - [ ] task\n    detail\n  + item\n    more')
  assert.equal(markdownAfter(state.apply(indented), indentActiveBlockTransaction(state.apply(indented), 'out')), markdown)
})

test('Bear list type changes keep raw marker and continuation indentation', () => {
  const bulletState = selectedState('\t+ task\n\t  detail', 'md-1')
  assert.equal(
    markdownAfter(bulletState, changeBlockByIdTransaction(bulletState, 'md-1', { type: 'todo', checked: false })),
    '\t+ [ ] task\n\t  detail',
  )

  const todoState = selectedState('+ [X] task\n  detail', 'md-1')
  assert.equal(
    markdownAfter(todoState, changeBlockByIdTransaction(todoState, 'md-1', { type: 'list_item', kind: 'bullet' })),
    '+ task\n  detail',
  )

  const orderedState = selectedState('03) task\n    detail', 'md-1')
  assert.equal(
    markdownAfter(orderedState, changeBlockByIdTransaction(orderedState, 'md-1', { type: 'list_item', kind: 'ordered' })),
    '03) task\n    detail',
  )
})

test('Bear source edit lifts list children when parent stops being a list block', () => {
  const state = selectedState('- parent\n  - child\n    - grandchild\n- sibling', 'md-1')

  assert.equal(
    markdownAfter(state, markdownBlockSourceTransaction(state, 'md-1', 'parent edited')),
    'parent edited\n\n- child\n  - grandchild\n- sibling',
  )
})

