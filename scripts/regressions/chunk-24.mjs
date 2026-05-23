import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear enter splits list continuation text without leaking continuation indentation', () => {
  const state = textSelectionState('- [ ] task\n  detail', 'md-1', 'task'.length)
  const transaction = enterBlockTransaction(state)

  assert.equal(markdownAfter(state, transaction), '- [ ] task\n- [ ] detail')
})

test('Bear parent-end enter keeps list marker syntax after child subtree', () => {
  const bulletState = textSelectionState('+ parent\n  - child', 'md-1', 'parent'.length)
  assert.equal(markdownAfter(bulletState, enterListParentEndTransaction(bulletState)), '+ parent\n  - child\n+')

  const todoState = textSelectionState('+ [X] parent\n  - child', 'md-1', 'parent'.length)
  const todoTransaction = enterListParentEndTransaction(todoState)
  assert.equal(markdownAfter(todoState, todoTransaction), '+ [X] parent\n  - child\n+ [ ]')
  assert.equal(todoTransaction.doc.lastChild?.type.name, nanoNodeNames.todo)
  assert.equal(todoTransaction.doc.lastChild?.attrs.checkedMarker, 'X')

  const orderedState = textSelectionState('3) parent\n  - child', 'md-1', 'parent'.length)
  assert.equal(markdownAfter(orderedState, enterListParentEndTransaction(orderedState)), '3) parent\n  - child\n4)')

  const paddedState = textSelectionState('007) parent\n  - child', 'md-1', 'parent'.length)
  assert.equal(markdownAfter(paddedState, enterListParentEndTransaction(paddedState)), '007) parent\n  - child\n008)')
})

test('Bear empty list markers stay list blocks without trailing filler', () => {
  const markdown = '-\n3.\n4. next\n  -'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'list_item'
      ? { kind: block.kind, text: block.text, indent: block.indent, start: block.start ?? null }
      : null,
  ), [
    { kind: 'bullet', text: '', indent: 0, start: null },
    { kind: 'ordered', text: '', indent: 0, start: 3 },
    { kind: 'ordered', text: 'next', indent: 0, start: 4 },
    { kind: 'bullet', text: '', indent: 1, start: null },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})


