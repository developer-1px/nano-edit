import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear ordered list markers preserve imported Markdown source', () => {
  const markdown = '3) three\n4) four\n  8) nested'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'list_item' && block.kind === 'ordered'
      ? { start: block.start ?? null, orderedMarker: block.orderedMarker ?? '.', text: block.text, indent: block.indent }
      : null,
  ), [
    { start: 3, orderedMarker: ')', text: 'three', indent: 0 },
    { start: 4, orderedMarker: ')', text: 'four', indent: 0 },
    { start: 8, orderedMarker: ')', text: 'nested', indent: 1 },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('3) three')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'list_item', kind: 'ordered', indent: 0, start: 3, orderedMarker: ')', text: 'three', marks: [] },
    { id: 'b1-2', type: 'list_item', kind: 'ordered', indent: 0, start: 4, orderedMarker: ')', text: '', marks: [] },
  ])
})

test('Bear ordered list start text preserves imported Markdown source', () => {
  const markdown = '007) seven\n008) eight\n  0003. nested'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'list_item' && block.kind === 'ordered'
      ? {
          start: block.start ?? null,
          orderedStartText: block.orderedStartText ?? null,
          orderedMarker: block.orderedMarker ?? '.',
          text: block.text,
          indent: block.indent,
        }
      : null,
  ), [
    { start: 7, orderedStartText: '007', orderedMarker: ')', text: 'seven', indent: 0 },
    { start: 8, orderedStartText: '008', orderedMarker: ')', text: 'eight', indent: 0 },
    { start: 3, orderedStartText: '0003', orderedMarker: '.', text: 'nested', indent: 1 },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const taggedDocument = nanoDocumentFromMarkdown('007) seven #n\n008) eight #n\n  0003. nested #n')
  assert.equal(
    nanoDocumentIndex(taggedDocument).tags.find((entry) => entry.target === '#n')?.detail,
    'seven #n / eight #n / nested #n',
  )

  const shortcutState = textState('007) seven')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'list_item', kind: 'ordered', indent: 0, start: 7, orderedStartText: '007', orderedMarker: ')', text: 'seven', marks: [] },
    { id: 'b1-2', type: 'list_item', kind: 'ordered', indent: 0, start: 8, orderedStartText: '008', orderedMarker: ')', text: '', marks: [] },
  ])

  assert.equal(markdownAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), '007) seven\n008)')

  const enterState = textSelectionState('007) seven', 'md-1', 'seven'.length)
  assert.equal(markdownAfter(enterState, enterBlockTransaction(enterState)), '007) seven\n008)')
})

test('Collapsed heading sections behave as one block unit', () => {
  const state = selectedState('# A\n\none\n\n## B\n\ntwo\n\n# C\n\nthree', 'md-1')
  const collapsed = new Set(['md-1'])

  assert.equal(markdownCopyTextFromSelection(state, collapsed), '# A\n\none\n\n## B\n\ntwo')
  assert.equal(selectedBlockText(state, selectAdjacentBlockTransaction(state, 'down', collapsed)), 'C')
  assert.equal(markdownAfter(state, deleteActiveBlockTransaction(state, collapsed)), '# C\n\nthree')
  assert.equal(
    markdownAfter(state, markdownBlockSourceTransaction(state, 'md-1', '# X\n\nnext', collapsed)),
    '# X\n\nnext\n\n# C\n\nthree',
  )
  assert.equal(
    markdownAfter(state, moveActiveBlockTransaction(state, 'down', collapsed)),
    '# C\n\nthree\n\n# A\n\none\n\n## B\n\ntwo',
  )
  assert.equal(
    markdownAfter(state, moveBlockToTargetTransaction(state, 'md-1', 'md-5', 'after', collapsed)),
    '# C\n\nthree\n\n# A\n\none\n\n## B\n\ntwo',
  )
})
