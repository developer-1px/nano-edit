import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear shortcuts keep underline, strike, and multi-word tags distinct', () => {
  assert.deepEqual(blockAfterMarkShortcut('__bold', '__').marks, [
    { type: 'bold', from: 0, to: 4, marker: '__' },
  ])
  assert.deepEqual(blockAfterMarkShortcut('_italic', '_').marks, [
    { type: 'italic', from: 0, to: 6, marker: '_' },
  ])
  assert.deepEqual(blockAfterMarkShortcut('~under', '~').marks, [
    { type: 'underline', from: 0, to: 5 },
  ])
  assert.deepEqual(blockAfterMarkShortcut('~~strike~', '~').marks, [
    { type: 'strike', from: 0, to: 6 },
  ])
  assert.deepEqual(blockAfterMarkShortcut('``code ` span`', '`').marks, [
    { type: 'code', from: 0, to: 11, backtickLength: 2 },
  ])
  assert.deepEqual(blockAfterMarkShortcut('#multi word tag', '#').marks, [
    { type: 'tag', from: 0, to: 16, name: 'multi word tag' },
  ])

  const trailingTagState = textState('#multi word tag#')
  const trailingTag = trailingReferenceMarkTransaction(trailingTagState)
  assert.deepEqual(blocksAfter(trailingTagState, trailingTag)[0].marks, [
    { type: 'tag', from: 0, to: 16, name: 'multi word tag' },
  ])
})

test('Raw Markdown inline rendering catches underline inside table cells', () => {
  assert.deepEqual(rawMarkdownInlineDomSpec('cell __bold__ _italic_ ~under~ #multi word#'), [
    'cell ',
    ['span', { class: 'nano-raw-format nano-raw-bold', title: 'bold' }, 'bold'],
    ' ',
    ['span', { class: 'nano-raw-format nano-raw-italic', title: 'italic' }, 'italic'],
    ' ',
    ['span', { class: 'nano-raw-format nano-raw-underline', title: 'under' }, 'under'],
    ' ',
    ['span', { class: 'nano-raw-tag', 'data-tag': 'multi word', title: 'multi word' }, 'multi word'],
  ])
})

test('Markdown-visible block tokens expose source editing hooks', () => {
  const blocks = [
    { id: 'heading', type: 'heading', level: 1, text: 'Title', marks: [] },
    { id: 'quote', type: 'quote', text: 'Quote', marks: [] },
    { id: 'callout', type: 'callout', tone: 'tip', text: 'Tip', marks: [] },
    { id: 'list', type: 'list_item', kind: 'ordered', start: 7, orderedStartText: '007', orderedMarker: ')', text: 'Seven', marks: [] },
    { id: 'footnote', type: 'footnote', name: '1', text: 'Detail', marks: [] },
    { id: 'code', type: 'code', language: 'ts', text: 'const x = 1' },
    { id: 'math', type: 'math', text: 'E=mc^2' },
    { id: 'divider', type: 'divider' },
    { id: 'bookmark', type: 'bookmark', href: 'https://bear.app/path' },
    { id: 'attachment', type: 'attachment', src: 'files/brief.pdf', label: 'Project brief' },
    { id: 'note-ref', type: 'note_ref', target: 'Target Note' },
    { id: 'tag-ref', type: 'tag_ref', name: 'projects/editor' },
    { id: 'image', type: 'image', src: 'assets/logo.png', alt: 'logo' },
    { id: 'table', type: 'table', rows: [['A', 'B'], ['1', '2']] },
  ]

  for (const block of blocks) {
    assert(
      domSpecHasClass(blockDomSpec(block), 'nano-source-token'),
      `${block.type} should expose a source token`,
    )
  }
})

test('Block source tokens expose quiet visual labels', () => {
  const codeFences = domSpecElementsByClass(blockDomSpec({ id: 'code', type: 'code', language: 'ts', text: 'const x = 1' }), 'nano-code-fence')
  assert.equal(codeFences[0][1]['data-fence-role'], 'open')
  assert.equal(codeFences[0][1]['data-label'], 'ts')
  assert.equal(codeFences[1][1]['data-fence-role'], 'close')

  const mathFences = domSpecElementsByClass(blockDomSpec({ id: 'math', type: 'math', text: 'E=mc^2' }), 'nano-math-fence')
  assert.equal(mathFences[0][1]['data-fence-role'], 'open')
  assert.equal(mathFences[1][1]['data-fence-role'], 'close')

  const footnoteMarkers = domSpecElementsByClass(blockDomSpec({ id: 'footnote', type: 'footnote', name: 'commands', text: 'Detail', marks: [] }), 'nano-footnote-marker')
  assert.equal(footnoteMarkers[0][1]['data-label'], 'commands')
})

function domSpecElementsByClass(spec, className) {
  if (!Array.isArray(spec)) return []
  const attrs = spec[1] && typeof spec[1] === 'object' && !Array.isArray(spec[1]) ? spec[1] : null
  const own = typeof attrs?.class === 'string' && attrs.class.split(/\s+/).includes(className) ? [spec] : []
  return own.concat(spec.flatMap((part) => domSpecElementsByClass(part, className)))
}
