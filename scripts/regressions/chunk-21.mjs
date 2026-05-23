import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear empty todos stay todo blocks without trailing filler', () => {
  const markdown = '- [ ]\n- [x]\n  - [ ] child'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'todo' ? { checked: block.checked, text: block.text, indent: block.indent } : null,
  ), [
    { checked: false, text: '', indent: 0 },
    { checked: true, text: '', indent: 0 },
    { checked: false, text: 'child', indent: 1 },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear checked todos preserve uppercase checkbox markers', () => {
  const markdown = '* [X] DONE\n+ [x] done'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'todo'
      ? { marker: block.marker ?? '-', checked: block.checked, checkedMarker: block.checkedMarker ?? 'x', text: block.text }
      : null,
  ), [
    { marker: '*', checked: true, checkedMarker: 'X', text: 'DONE' },
    { marker: '+', checked: true, checkedMarker: 'x', text: 'done' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentIndex(document).todos.map((entry) => entry.checkedMarker ?? 'x'), ['X', 'x'])

  const shortcutState = textState('- [X] DONE')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'todo', checked: true, indent: 0, checkedMarker: 'X', text: 'DONE', marks: [] },
    { id: 'b1-2', type: 'todo', checked: false, indent: 0, text: '', marks: [] },
  ])
})

test('Bear todo marker backspace degrades checkbox syntax before list syntax', () => {
  const checkedState = textSelectionState('* [X] DONE', 'md-1', 0)
  assert.equal(markdownAfter(checkedState, backspaceBlockTransaction(checkedState)), '* DONE')

  const uncheckedState = textSelectionState('- [ ] task', 'md-1', 0)
  const bulletTransaction = backspaceBlockTransaction(uncheckedState)
  assert.equal(markdownAfter(uncheckedState, bulletTransaction), '- task')

  const bulletState = uncheckedState.apply(bulletTransaction)
  assert.equal(markdownAfter(bulletState, backspaceBlockTransaction(bulletState)), 'task')
})

test('Bear typed checkbox marker inside a bullet becomes todo structure', () => {
  const uncheckedState = textSelectionState('- [ ]task', 'md-1', 3)
  assert.equal(
    markdownAfter(uncheckedState, blockShortcutTransaction(uncheckedState, uncheckedState.selection.from, uncheckedState.selection.from, ' ')),
    '- [ ] task',
  )

  const checkedState = textSelectionState('* [X]DONE', 'md-1', 3)
  assert.equal(
    markdownAfter(checkedState, blockShortcutTransaction(checkedState, checkedState.selection.from, checkedState.selection.from, ' ')),
    '* [X] DONE',
  )
})

test('Bear list marker input at visual list start edits source marker, not content', () => {
  const bulletState = textSelectionState('- item', 'md-1', 0)
  assert.equal(
    markdownAfter(bulletState, blockShortcutTransaction(bulletState, bulletState.selection.from, bulletState.selection.from, '*')),
    '* item',
  )

  const sameMarkerState = textSelectionState('- item', 'md-1', 0)
  assert.equal(
    markdownAfter(sameMarkerState, blockShortcutTransaction(sameMarkerState, sameMarkerState.selection.from, sameMarkerState.selection.from, '-')),
    '- item',
  )

  const orderedState = textSelectionState('1. item', 'md-1', 0)
  assert.equal(
    markdownAfter(orderedState, blockShortcutTransaction(orderedState, orderedState.selection.from, orderedState.selection.from, ')')),
    '1) item',
  )

  const orderedStartState = textSelectionState('1. item', 'md-1', 0)
  assert.equal(
    markdownAfter(orderedStartState, blockShortcutTransaction(orderedStartState, orderedStartState.selection.from, orderedStartState.selection.from, '7')),
    '7. item',
  )

  const paddedOrderedStartState = textSelectionState('007) item', 'md-1', 0)
  assert.equal(
    markdownAfter(paddedOrderedStartState, blockShortcutTransaction(paddedOrderedStartState, paddedOrderedStartState.selection.from, paddedOrderedStartState.selection.from, '8')),
    '008) item',
  )
})

test('Bear todo marker input at visual checkbox start edits source marker and checkbox state', () => {
  const markerState = textSelectionState('- [ ] task', 'md-1', 0)
  assert.equal(
    markdownAfter(markerState, blockShortcutTransaction(markerState, markerState.selection.from, markerState.selection.from, '+')),
    '+ [ ] task',
  )

  const checkedState = textSelectionState('- [ ] task', 'md-1', 0)
  assert.equal(
    markdownAfter(checkedState, blockShortcutTransaction(checkedState, checkedState.selection.from, checkedState.selection.from, 'X')),
    '- [X] task',
  )

  const uncheckedState = textSelectionState('* [x] task', 'md-1', 0)
  assert.equal(
    markdownAfter(uncheckedState, blockShortcutTransaction(uncheckedState, uncheckedState.selection.from, uncheckedState.selection.from, ' ')),
    '* [ ] task',
  )
})

test('Bear list continuation lines stay inside one block', () => {
  const markdown = [
    '- parent',
    '  continued **bold**',
    '  - child',
    '- sibling',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) => {
    if (block.type !== 'list_item') return null
    return {
      id: block.id,
      indent: block.indent,
      text: block.text,
      marks: block.marks,
    }
  }), [
    {
      id: 'md-1',
      indent: 0,
      text: 'parent\ncontinued bold',
      marks: [{ type: 'bold', from: 17, to: 21 }],
    },
    { id: 'md-2', indent: 1, text: 'child', marks: [] },
    { id: 'md-3', indent: 0, text: 'sibling', marks: [] },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear list continuation indentation feels editable through input and backspace', () => {
  const continuationState = textSelectionState('- parent\n  detail', 'md-1', 'parent\n'.length)
  assert.equal(
    markdownAfter(continuationState, blockShortcutTransaction(continuationState, continuationState.selection.from, continuationState.selection.from, ' ')),
    '- parent\n   detail',
  )
  assert.equal(markdownAfter(continuationState, backspaceBlockTransaction(continuationState)), '- parent\n detail')
})
