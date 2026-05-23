import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear setext headings stay heading blocks without stealing separated dividers', () => {
  const markdown = 'Title\n=====\n\nSubtitle\n---\n\nBody\n\n---'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) => {
    if (block.type === 'heading') {
      return {
        type: block.type,
        level: block.level,
        text: block.text,
        headingStyle: block.headingStyle ?? 'atx',
        setextMarker: block.setextMarker ?? null,
        setextLength: block.setextLength ?? null,
      }
    }
    return { type: block.type }
  }), [
    { type: 'heading', level: 1, text: 'Title', headingStyle: 'setext', setextMarker: '=', setextLength: 5 },
    { type: 'heading', level: 2, text: 'Subtitle', headingStyle: 'setext', setextMarker: '-', setextLength: 3 },
    { type: 'paragraph' },
    { type: 'divider' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentIndex(document).outline.map((entry) => entry.label), ['Title', 'Subtitle'])
  assert.deepEqual(nanoDocumentSearch(document, '=====')?.blockIds, ['md-1'])
})

test('Bear setext heading marker backspace removes hidden underline syntax', () => {
  const h1State = textSelectionState('Title\n=====', 'md-1', 0)
  assert.equal(markdownAfter(h1State, backspaceBlockTransaction(h1State)), 'Title')
  assert.deepEqual(blocksAfter(h1State, backspaceBlockTransaction(h1State)), [
    { id: 'md-1', type: 'paragraph', text: 'Title', marks: [] },
  ])

  const h2State = textSelectionState('Subtitle\n---', 'md-1', 0)
  assert.equal(markdownAfter(h2State, backspaceBlockTransaction(h2State)), 'Subtitle')
  assert.deepEqual(blocksAfter(h2State, backspaceBlockTransaction(h2State)), [
    { id: 'md-1', type: 'paragraph', text: 'Subtitle', marks: [] },
  ])
})

test('Bear code fences preserve info strings and content-looking fences', () => {
  const markdown = '```ts title="nano"\n``` not close\n```'
  const canonical = '````ts title="nano"\n``` not close\n````'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(document.blocks[0].type, 'code')
  assert.equal(document.blocks[0].language, 'ts title="nano"')
  assert.equal(document.blocks[0].text, '``` not close')
  assert.equal(nanoMarkdownFromDocument(document), canonical)
  assert.equal(nanoMarkdownFromDocument(nanoDocumentFromMarkdown(canonical)), canonical)
  assert.equal(
    nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(nanoDocumentFromMarkdown(canonical))) }),
    canonical,
  )
})

test('Bear code and math fence backspace removes hidden fence syntax', () => {
  const codeState = textSelectionState('```ts\nconst value is one\n```', 'md-1', 0)
  assert.equal(markdownAfter(codeState, backspaceBlockTransaction(codeState)), 'const value is one')
  assert.deepEqual(blocksAfter(codeState, backspaceBlockTransaction(codeState)), [
    { id: 'md-1', type: 'paragraph', text: 'const value is one', marks: [] },
  ])

  const mathState = textSelectionState('$$\na+b\n$$', 'md-1', 0)
  assert.equal(markdownAfter(mathState, backspaceBlockTransaction(mathState)), 'a+b')
  assert.deepEqual(blocksAfter(mathState, backspaceBlockTransaction(mathState)), [
    { id: 'md-1', type: 'paragraph', text: 'a+b', marks: [] },
  ])
})

test('Bear code fence markers preserve imported Markdown source', () => {
  const markdown = '~~~~js\nconst ticks = "```"\n~~~~'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'code',
    text: 'const ticks = "```"',
    language: 'js',
    fenceMarker: '~',
    fenceLength: 4,
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(nanoDocumentSearch(document, '~~~~js')?.blockIds, ['md-1'])

  const shortcutState = textState('~~~~js')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'code', text: '', language: 'js', fenceMarker: '~', fenceLength: 4 },
  ])

  const spacedShortcutState = textState('~~~~ js')
  assert.deepEqual(blocksAfter(spacedShortcutState, blockEnterShortcutTransaction(spacedShortcutState)), [
    { id: 'b1', type: 'code', text: '', language: 'js', fenceInfoSpacing: ' ', fenceMarker: '~', fenceLength: 4 },
  ])
  assert.equal(markdownAfter(spacedShortcutState, blockEnterShortcutTransaction(spacedShortcutState)), '~~~~ js\n\n~~~~')
})
