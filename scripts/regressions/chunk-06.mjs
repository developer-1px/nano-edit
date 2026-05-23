import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, inlineMarkBoundaryTransaction, inlineSourceTokenDeleteTransaction, inlineSourceTokenTextInputTransaction, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, markdownPasteTransaction, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

function textRangeSelectionState(markdown, blockId, fromOffset, toOffset) {
  const doc = prosemirrorDocFromNano(nanoDocumentFromMarkdown(markdown))
  const position = blockPositionById(doc, blockId)
  assert.notEqual(position, null)
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, position + 1 + fromOffset, position + 1 + toOffset),
  })
}

test('Markdown-visible inline tokens expose source editing hooks', () => {
  const marks = [
    { type: 'bold', from: 0, to: 5 },
    { type: 'italic', from: 0, to: 5 },
    { type: 'underline', from: 0, to: 5 },
    { type: 'strike', from: 0, to: 5 },
    { type: 'highlight', from: 0, to: 5 },
    { type: 'code', from: 0, to: 5 },
    { type: 'tag', from: 0, to: 5, name: 'projects/editor' },
    { type: 'note_link', from: 0, to: 5, target: 'Target Note' },
    { type: 'math', from: 0, to: 5, formula: 'E=mc^2' },
    { type: 'footnote_ref', from: 0, to: 5, name: '1' },
    { type: 'link', from: 0, to: 5, href: 'https://example.com' },
  ]

  for (const mark of marks) {
    assert(
      domSpecHasClass(markDomSpec(mark), 'nano-source-token'),
      `${mark.type} should expose a source token`,
    )
  }
})

test('Inline reference marks expose visual labels without losing Markdown source hooks', () => {
  assertLabelledSourceMark(markDomSpec({ type: 'tag', from: 0, to: 7, name: 'project' }), 'project')
  assertLabelledSourceMark(markDomSpec({ type: 'note_link', from: 0, to: 8, target: 'Target Note' }), 'Target Note')
  assertLabelledSourceMark(markDomSpec({ type: 'note_link', from: 0, to: 5, target: 'Target Note', alias: 'alias' }), 'alias')
  assertLabelledSourceMark(markDomSpec({ type: 'math', from: 0, to: 5, formula: 'E=mc^2' }), 'E=mc^2')
  assertLabelledSourceMark(markDomSpec({ type: 'footnote_ref', from: 0, to: 4, name: '1' }), '1')
})

test('Inline Markdown delimiters feel editable at visual mark boundaries', () => {
  const cases = [
    ['**bold**', 0, 4, 'bold'],
    ['*italic*', 0, 6, 'italic'],
    ['~under~', 0, 5, 'under'],
    ['~~strike~~', 0, 6, 'strike'],
    ['==high==', 0, 4, 'high'],
    ['`code`', 0, 4, 'code'],
  ]

  for (const [markdown, from, to, expected] of cases) {
    const startState = textSelectionState(markdown, 'md-1', from)
    assert.equal(markdownAfter(startState, inlineMarkBoundaryTransaction(startState, 'backward')), expected)

    const endState = textSelectionState(markdown, 'md-1', to)
    assert.equal(markdownAfter(endState, inlineMarkBoundaryTransaction(endState, 'forward')), expected)
  }

  const linkEndState = textSelectionState('Visit [site](https://example.com "Example Site")', 'md-1', 10)
  assert.equal(markdownAfter(linkEndState, inlineMarkBoundaryTransaction(linkEndState, 'forward')), 'Visit site')
})

test('Inline source-token marks unwrap to their visual labels at boundaries', () => {
  const cases = [
    ['See #project now', 4, 12, 'See project now'],
    ['See [[Target Note|alias]] now', 4, 25, 'See alias now'],
    ['See $x + y$ now', 4, 11, 'See x + y now'],
    ['See [^commands] now', 4, 15, 'See commands now'],
    ['Visit <https://example.com> now', 6, 27, 'Visit https://example.com now'],
  ]

  for (const [markdown, from, to, expected] of cases) {
    const startState = textSelectionState(markdown, 'md-1', from)
    assert.equal(markdownAfter(startState, inlineMarkBoundaryTransaction(startState, 'backward')), expected)

    const endState = textSelectionState(markdown, 'md-1', to)
    assert.equal(markdownAfter(endState, inlineMarkBoundaryTransaction(endState, 'forward')), expected)
  }
})

test('Inline autolinks show URL text without visible angle syntax', () => {
  const spec = markDomSpec({ type: 'link', from: 0, to: 21, href: 'https://example.com', syntax: 'autolink' })
  assert.equal(spec[1]['data-syntax'], 'autolink')
  assertLabelledSourceMark(spec, 'https://example.com')
})

function assertLabelledSourceMark(spec, label) {
  assert.equal(spec[1]['data-label'], label)
  assert.equal(spec[1]['aria-label'], label)
  assert.equal(spec[2][0], 'span')
  assert.equal(spec[2][1]['aria-hidden'], 'true')
  assert.equal(spec[2][2], 0)
}

test('Inline source-token interior input unwraps before editing hidden syntax', () => {
  const noteState = textSelectionState('See [[Target Note|alias]] now', 'md-1', 23)
  assert.equal(
    markdownAfter(noteState, inlineSourceTokenTextInputTransaction(noteState, noteState.selection.from, noteState.selection.to, '!')),
    'See alias! now',
  )

  const autolinkState = textSelectionState('Visit <https://example.com> now', 'md-1', 26)
  assert.equal(
    markdownAfter(autolinkState, inlineSourceTokenTextInputTransaction(autolinkState, autolinkState.selection.from, autolinkState.selection.to, '!')),
    'Visit https://example.com! now',
  )
})

test('Inline source-token selections replace whole visual labels', () => {
  const noteState = textRangeSelectionState('See [[Target Note|alias]] now', 'md-1', 8, 14)
  assert.equal(
    markdownAfter(noteState, inlineSourceTokenTextInputTransaction(noteState, noteState.selection.from, noteState.selection.to, 'Topic')),
    'See Topic now',
  )

  const autolinkState = textRangeSelectionState('Visit <https://example.com> now', 'md-1', 12, 18)
  assert.equal(
    markdownAfter(autolinkState, inlineSourceTokenTextInputTransaction(autolinkState, autolinkState.selection.from, autolinkState.selection.to, 'site')),
    'Visit site now',
  )
})

test('Inline source-token delete unwraps interior edits instead of mutating hidden Markdown', () => {
  const footnoteState = textSelectionState('See [^commands] now', 'md-1', 14)
  assert.equal(
    markdownAfter(footnoteState, inlineSourceTokenDeleteTransaction(footnoteState, 'backward')),
    'See command now',
  )

  const autolinkState = textRangeSelectionState('Visit <https://example.com> now', 'md-1', 12, 18)
  assert.equal(
    markdownAfter(autolinkState, inlineSourceTokenDeleteTransaction(autolinkState, 'forward')),
    'Visit  now',
  )
})

test('Inline source-token edge delete edits visual labels instead of hidden Markdown', () => {
  const noteStartState = textSelectionState('See [[Target Note|alias]] now', 'md-1', 4)
  assert.equal(
    markdownAfter(noteStartState, inlineSourceTokenDeleteTransaction(noteStartState, 'forward')),
    'See lias now',
  )

  const noteEndState = textSelectionState('See [[Target Note|alias]] now', 'md-1', 25)
  assert.equal(
    markdownAfter(noteEndState, inlineSourceTokenDeleteTransaction(noteEndState, 'backward')),
    'See alia now',
  )

  const autolinkStartState = textSelectionState('Visit <https://example.com> now', 'md-1', 6)
  assert.equal(
    markdownAfter(autolinkStartState, inlineSourceTokenDeleteTransaction(autolinkStartState, 'forward')),
    'Visit ttps://example.com now',
  )

  const tagEndState = textSelectionState('See #project now', 'md-1', 12)
  assert.equal(
    markdownAfter(tagEndState, inlineSourceTokenDeleteTransaction(tagEndState, 'backward')),
    'See projec now',
  )
})

test('Inline source-token paste unwraps before editing hidden Markdown', () => {
  const noteState = textSelectionState('See [[Target Note|alias]] now', 'md-1', 8)
  assert.equal(
    markdownAfter(noteState, markdownPasteTransaction(noteState, 'Topic')),
    'See Topicalias now',
  )

  const autolinkState = textRangeSelectionState('Visit <https://example.com> now', 'md-1', 12, 18)
  assert.equal(
    markdownAfter(autolinkState, markdownPasteTransaction(autolinkState, 'site')),
    'Visit site now',
  )
})

test('Inline visual token selections copy Markdown source', () => {
  const cases = [
    ['See [[Target Note|alias]] now', 4, 25, '[[Target Note|alias]]'],
    ['See #project now', 4, 12, '#project'],
    ['See [^commands] now', 4, 15, '[^commands]'],
    ['Visit <https://example.com> now', 6, 27, '<https://example.com>'],
    ['Visit [site](https://example.com "Example Site") now', 6, 10, '[site](https://example.com "Example Site")'],
    ['Use **bold** now', 4, 8, '**bold**'],
  ]

  for (const [markdown, from, to, expected] of cases) {
    assert.equal(markdownCopyTextFromSelection(textRangeSelectionState(markdown, 'md-1', from, to)), expected)
  }
})

test('Escaped Bear tags stay literal Markdown text', () => {
  const markdown = 'Escaped \\#not-a-tag and real #tag'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[0], {
    id: 'md-1',
    type: 'paragraph',
    text: 'Escaped #not-a-tag and real #tag',
    marks: [{ type: 'tag', from: 28, to: 32, name: 'tag' }],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(rawMarkdownInlineDomSpec('cell \\#not-a-tag and #tag'), [
    'cell \\',
    '#not-a-tag and ',
    ['span', { class: 'nano-raw-tag', 'data-tag': 'tag', title: 'tag' }, 'tag'],
  ])
})

test('Bear Markdown links preserve title text', () => {
  const markdown = 'Visit [site](https://example.com "Example Site")'
  const document = nanoDocumentFromMarkdown(markdown)
  const mark = document.blocks[0].marks[0]

  assert.deepEqual(mark, { type: 'link', from: 6, to: 10, href: 'https://example.com', title: 'Example Site' })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
  assert.deepEqual(blockAfterMarkShortcut('[site](https://example.com "Example Site"', ')').marks, [
    { type: 'link', from: 0, to: 4, href: 'https://example.com', title: 'Example Site' },
  ])
  assert.deepEqual(rawMarkdownInlineDomSpec('cell [site](https://example.com "Example Site")'), [
    'cell ',
    [
      'span',
      {
        class: 'nano-raw-link',
        'data-href': 'https://example.com',
        'data-title': 'Example Site',
        title: 'Example Site',
      },
      'site',
    ],
  ])
})
