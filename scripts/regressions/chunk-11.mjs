import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear tables preserve Markdown column alignment', () => {
  const markdown = [
    '| Left | Center | Right |',
    '| :--- | :---: | ---: |',
    '| #tag | [[Note]] | [site](https://example.com) |',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'table')
  assert.deepEqual(document.blocks[0].align, ['left', 'center', 'right'])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear table source token mirrors the stored Markdown table', () => {
  const markdown = [
    '| A | B |',
    '| --- | --- |',
    '| 1 | 2 |',
    '| 3 | 4 |',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)
  const token = domSpecElementByClass(blockDomSpec(document.blocks[0]), 'nano-table-markdown')

  assert.equal(token[1].contenteditable, 'false')
  assert.equal(token[2], markdown)
})

test('Bear table separator cells preserve imported Markdown source', () => {
  const markdown = [
    '| Plain | Wide Left | Wide Center | Wide Right |',
    '| ---- | :----- | :-----: | -----: |',
    '| a | b | c | d |',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'table')
  assert.deepEqual(document.blocks[0].align, [null, 'left', 'center', 'right'])
  assert.deepEqual(document.blocks[0].separatorCells, ['----', ':-----', ':-----:', '-----:'])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

function domSpecElementByClass(spec, className) {
  if (!Array.isArray(spec)) return null
  const attrs = spec[1] && typeof spec[1] === 'object' && !Array.isArray(spec[1]) ? spec[1] : null
  if (typeof attrs?.class === 'string' && attrs.class.split(/\s+/).includes(className)) return spec
  for (const part of spec) {
    const found = domSpecElementByClass(part, className)
    if (found) return found
  }
  return null
}

test('Bear table outer pipes preserve imported Markdown source', () => {
  const markdown = [
    'Plain | Center | Right',
    '--- | :---: | ---:',
    'a | b | c',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'table')
  assert.equal(document.blocks[0].leadingPipe, false)
  assert.equal(document.blocks[0].trailingPipe, false)
  assert.deepEqual(document.blocks[0].align, [null, 'center', 'right'])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const state = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(state, changeBlockByIdTransaction(state, 'md-1', { type: 'table' })),
    markdown,
  )
  assert.equal(
    markdownAfter(state, markdownBlockSourceTransaction(state, 'md-1', 'A | B\n--- | ---\n1 | 2')),
    'A | B\n--- | ---\n1 | 2',
  )
})
