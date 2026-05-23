import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h
const { backspaceKeyCommand, deleteKeyCommand, inlineMarkBoundaryTransaction, selectedAtomSourceTransaction } = h

test('Standalone bookmark blocks preserve explicit angle destinations', () => {
  const markdown = '[Bear](<https://bear.app> "Bear Home")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    {
      id: 'md-1',
      type: 'bookmark',
      href: 'https://bear.app',
      label: 'Bear',
      title: 'Bear Home',
      destinationStyle: 'angle',
      syntax: 'markdown',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).bookmarks.some((entry) => entry.label === 'Bear' && entry.target === 'https://bear.app'))

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'bookmark',
      href: 'https://bear.app',
      label: 'Bear',
      title: 'Bear Home',
      destinationStyle: 'angle',
      syntax: 'markdown',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])
})

test('Bookmark cards show visual destination without losing Markdown source token', () => {
  const spec = blockDomSpec({
    id: 'bookmark',
    type: 'bookmark',
    href: 'https://bear.app',
    label: 'Bear',
    title: 'Bear Home',
    destinationStyle: 'angle',
    syntax: 'markdown',
  })
  const link = domSpecElementByClass(spec, 'nano-bookmark-link')
  const url = domSpecElementByClass(spec, 'nano-bookmark-url')

  assert(link.includes(' '))
  assert.equal(url[1]['data-source'], '[Bear](<https://bear.app> "Bear Home")')
  assert.equal(url[1].contenteditable, 'false')
  assert.equal(url[2], 'https://bear.app')
})

test('Standalone file links become attachment blocks without stealing external bookmarks', () => {
  const markdown = '[Project brief](files/brief.pdf "PDF")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    {
      id: 'md-1',
      type: 'attachment',
      src: 'files/brief.pdf',
      label: 'Project brief',
      title: 'PDF',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert(nanoDocumentIndex(document).attachments.some((entry) => entry.label === 'Project brief' && entry.target === 'files/brief.pdf'))

  const shortcutState = textState(markdown)
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    {
      id: 'b1',
      type: 'attachment',
      src: 'files/brief.pdf',
      label: 'Project brief',
      title: 'PDF',
    },
    { id: 'b1-after', type: 'paragraph', text: '', marks: [] },
  ])

  const sourceState = selectedState(markdown, 'md-1')
  assert.equal(
    markdownAfter(sourceState, markdownBlockSourceTransaction(sourceState, 'md-1', '[Project brief](<files/project brief.pdf> "PDF")')),
    '[Project brief](<files/project brief.pdf> "PDF")',
  )

  const spec = blockDomSpec(document.blocks[0])
  const link = domSpecElementByClass(spec, 'nano-attachment-link')
  const source = domSpecElementByClass(spec, 'nano-attachment-src')
  assert(link.includes(' '))
  assert.equal(source[1].contenteditable, 'false')
  assert.equal(source[2], markdown)
})

test('Reference cards keep nested source tokens non-editable', () => {
  const noteSpec = blockDomSpec({ id: 'note', type: 'note_ref', target: 'Release Notes', alias: 'Notes' })
  const noteToken = domSpecElementByClass(noteSpec, 'nano-note-ref-token')
  assert.equal(noteToken[1].contenteditable, 'false')
  assert.equal(noteToken[2], '[[Release Notes|Notes]]')

  const tagSpec = blockDomSpec({ id: 'tag', type: 'tag_ref', name: 'projects/editor' })
  const tagToken = domSpecElementByClass(tagSpec, 'nano-tag-ref-title')
  assert.equal(tagToken[1].contenteditable, 'false')
  assert.equal(tagToken[2], 'projects/editor')
})

test('Selected visual atom blocks unwrap to Markdown-editable paragraphs before deletion', () => {
  for (const markdown of [
    '[Bear](<https://bear.app> "Bear Home")',
    '[Project brief](files/brief.pdf "PDF")',
    '[[Target Note#Heading|display alias]]',
    '#projects/editor',
    '![Cover](assets/cover.png "Cover")',
    '![](assets/empty.png)',
    '| A | B |\n| --- | --- |\n| 1 | 2 |',
    '---',
  ]) {
    const state = selectedState(markdown, 'md-1')
    const transaction = selectedAtomSourceTransaction(state)
    const [block] = blocksAfter(state, transaction)

    assert.equal(block.type, 'paragraph')
    assert.equal(block.id, 'md-1')
    assert.equal(markdownAfter(state, transaction), markdown)
  }
})

test('Selected image cards unwrap with image delimiters as decoration, not literal content', () => {
  const imageState = selectedState('![Cover](assets/cover.png "Cover")', 'md-1')
  const imageTransaction = selectedAtomSourceTransaction(imageState)
  assert.deepEqual(blocksAfter(imageState, imageTransaction), [{
    id: 'md-1',
    type: 'paragraph',
    text: 'Cover',
    marks: [{ type: 'link', from: 0, to: 5, href: 'assets/cover.png', title: 'Cover', image: true }],
  }])
  assert.equal(markdownAfter(imageState, imageTransaction), '![Cover](assets/cover.png "Cover")')

  const emptyState = selectedState('![](assets/empty.png)', 'md-1')
  const emptyTransaction = selectedAtomSourceTransaction(emptyState)
  assert.deepEqual(blocksAfter(emptyState, emptyTransaction), [{
    id: 'md-1',
    type: 'paragraph',
    text: '[]',
    marks: [{ type: 'link', from: 0, to: 2, href: 'assets/empty.png', image: true, imageEmptyAlt: true }],
  }])
  assert.equal(markdownAfter(emptyState, emptyTransaction), '![](assets/empty.png)')
})

test('Selected divider blocks unwrap to exact Markdown source markers', () => {
  for (const markdown of ['---', '***', '_____']) {
    const state = selectedState(markdown, 'md-1')
    const transaction = selectedAtomSourceTransaction(state)
    assert.deepEqual(blocksAfter(state, transaction), [{
      id: 'md-1',
      type: 'paragraph',
      text: markdown,
      marks: [{ type: 'source', from: 0, to: markdown.length }],
    }])
    assert.equal(markdownAfter(state, transaction), markdown)
  }
})

test('Inline image link marks render source delimiters as quiet decoration', () => {
  const spec = markDomSpec({ type: 'link', from: 0, to: 5, href: 'assets/cover.png', title: 'Cover', image: true })
  assert.equal(spec[1]['data-md-open'], '![')
  assert.equal(spec[1]['data-md-close'], '](assets/cover.png "Cover")')
  assert.equal(spec[1]['data-image'], 'true')

  const emptySpec = markDomSpec({ type: 'link', from: 0, to: 2, href: 'assets/empty.png', image: true, imageEmptyAlt: true })
  assert.equal(emptySpec[1]['data-md-open'], '!')
  assert.equal(emptySpec[1]['data-md-close'], '(assets/empty.png)')
  assert.equal(emptySpec[1]['data-image-empty-alt'], 'true')
})

test('Copied visual image source labels preserve image Markdown', () => {
  const imageState = appliedState(
    selectedState('![Cover](assets/cover.png "Cover")', 'md-1'),
    selectedAtomSourceTransaction,
  )
  const imageSelection = imageState.apply(imageState.tr.setSelection(TextSelection.create(imageState.doc, 1, 6)))
  assert.equal(
    markdownCopyTextFromSelection(imageSelection),
    '![Cover](assets/cover.png "Cover")',
  )

  const emptyState = appliedState(
    selectedState('![](assets/empty.png)', 'md-1'),
    selectedAtomSourceTransaction,
  )
  const emptySelection = emptyState.apply(emptyState.tr.setSelection(TextSelection.create(emptyState.doc, 1, 3)))
  assert.equal(markdownCopyTextFromSelection(emptySelection), '![](assets/empty.png)')
})

test('Raw source marks preserve exact Markdown gesture text', () => {
  const spec = markDomSpec({ type: 'source', from: 0, to: 3 })
  assert.equal(domSpecHasClass(spec, 'nano-raw-source'), true)
  assert.equal(nanoMarkdownFromDocument({
    blocks: [{ id: 'source', type: 'paragraph', text: '***', marks: [{ type: 'source', from: 0, to: 3 }] }],
  }), '***')
})

test('Raw source marks do not unwrap into escaped Markdown at text boundaries', () => {
  const startState = sourceMarkedState('***', 0)
  assert.equal(inlineMarkBoundaryTransaction(startState, 'backward'), null)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(startState.doc) }), '***')

  const endState = sourceMarkedState('***', 3)
  assert.equal(inlineMarkBoundaryTransaction(endState, 'forward'), null)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(endState.doc) }), '***')
})

test('Backspace and Delete on selected visual atom blocks reveal editable Markdown shape first', () => {
  const markdown = '[Bear](<https://bear.app> "Bear Home")'
  const context = { collapsedBlockIds: new Set() }

  const backspaceState = selectedState(markdown, 'md-1')
  const backspaceTransaction = dispatchedKeyTransaction(backspaceKeyCommand(context), backspaceState)
  assert.equal(blocksAfter(backspaceState, backspaceTransaction)[0].type, 'paragraph')
  assert.equal(markdownAfter(backspaceState, backspaceTransaction), markdown)

  const deleteState = selectedState(markdown, 'md-1')
  const deleteTransaction = dispatchedKeyTransaction(deleteKeyCommand(context), deleteState)
  assert.equal(blocksAfter(deleteState, deleteTransaction)[0].type, 'paragraph')
  assert.equal(markdownAfter(deleteState, deleteTransaction), markdown)
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

function dispatchedKeyTransaction(command, state) {
  let transaction = null
  assert.equal(command(state, (nextTransaction) => {
    transaction = nextTransaction
  }), true)
  assert(transaction)
  return transaction
}

function appliedState(state, transactionFn) {
  const transaction = transactionFn(state)
  assert(transaction)
  return state.apply(transaction)
}

function sourceMarkedState(text, offset) {
  const doc = prosemirrorDocFromNano({
    blocks: [{ id: 'source', type: 'paragraph', text, marks: [{ type: 'source', from: 0, to: text.length }] }],
  })
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1 + offset),
  })
}

test('Standalone angle-wrapped file links become attachment blocks with spaces', () => {
  const markdown = '[Project brief](<files/project brief.pdf> "PDF")'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks, [
    {
      id: 'md-1',
      type: 'attachment',
      src: 'files/project brief.pdf',
      label: 'Project brief',
      title: 'PDF',
    },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})
