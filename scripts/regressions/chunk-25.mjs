import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear unordered list markers preserve imported Markdown source', () => {
  const markdown = '* alpha\n+ beta\n  * [ ] task'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) => {
    if (block.type === 'list_item') return { type: block.type, marker: block.marker ?? '-', text: block.text, indent: block.indent }
    if (block.type === 'todo') return { type: block.type, marker: block.marker ?? '-', text: block.text, indent: block.indent }
    return null
  }), [
    { type: 'list_item', marker: '*', text: 'alpha', indent: 0 },
    { type: 'list_item', marker: '+', text: 'beta', indent: 0 },
    { type: 'todo', marker: '*', text: 'task', indent: 1 },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('+ beta')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'list_item', kind: 'bullet', indent: 0, marker: '+', text: 'beta', marks: [] },
    { id: 'b1-2', type: 'list_item', kind: 'bullet', indent: 0, marker: '+', text: '', marks: [] },
  ])
})

test('Bear list indent text preserves imported Markdown source', () => {
  const markdown = '\t* tab bullet\n   + odd bullet\n \t3) mixed ordered\n\t- [X] task'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) => {
    if (block.type === 'list_item') {
      return {
        type: block.type,
        kind: block.kind,
        indent: block.indent,
        indentText: block.indentText ?? null,
        marker: block.marker ?? null,
        orderedMarker: block.orderedMarker ?? null,
        text: block.text,
      }
    }
    if (block.type === 'todo') {
      return {
        type: block.type,
        indent: block.indent,
        indentText: block.indentText ?? null,
        marker: block.marker ?? null,
        checkedMarker: block.checkedMarker ?? null,
        text: block.text,
      }
    }
    return null
  }), [
    { type: 'list_item', kind: 'bullet', indent: 2, indentText: '\t', marker: '*', orderedMarker: null, text: 'tab bullet' },
    { type: 'list_item', kind: 'bullet', indent: 1, indentText: '   ', marker: '+', orderedMarker: null, text: 'odd bullet' },
    { type: 'list_item', kind: 'ordered', indent: 2, indentText: ' \t', marker: null, orderedMarker: ')', text: 'mixed ordered' },
    { type: 'todo', indent: 2, indentText: '\t', marker: null, checkedMarker: 'X', text: 'task' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('\t+ tab')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'list_item', kind: 'bullet', indent: 2, indentText: '\t', marker: '+', text: 'tab', marks: [] },
    { id: 'b1-2', type: 'list_item', kind: 'bullet', indent: 2, indentText: '\t', marker: '+', text: '', marks: [] },
  ])

  const backspaceState = textSelectionState('\t+ task\n\t  detail', 'md-1', 0)
  const transaction = backspaceBlockTransaction(backspaceState)
  assert.equal(markdownAfter(backspaceState, transaction), '  + task\n    detail')
  assert.deepEqual(blocksAfter(backspaceState, transaction), [
    { id: 'md-1', type: 'list_item', kind: 'bullet', indent: 1, marker: '+', text: 'task\ndetail', marks: [] },
  ])
})

test('Bear ordered lists preserve explicit start numbers', () => {
  const markdown = '3. three\n4. four\n  8. nested'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'list_item' && block.kind === 'ordered' ? block.start : null,
  ), [3, 4, 8])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

