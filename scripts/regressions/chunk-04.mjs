import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Bear footnote definition spacing preserves imported Markdown source', () => {
  const markdown = '[^tight]:body\n\n[^loose]: body'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks.map((block) =>
    block.type === 'footnote'
      ? {
          name: block.name,
          footnoteTextSpacing: block.footnoteTextSpacing ?? 'space',
          text: block.text,
        }
      : null,
  ), [
    { name: 'tight', footnoteTextSpacing: 'none', text: 'body' },
    { name: 'loose', footnoteTextSpacing: 'space', text: 'body' },
  ])
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)

  const shortcutState = textState('[^note]:body')
  assert.deepEqual(blocksAfter(shortcutState, blockEnterShortcutTransaction(shortcutState)), [
    { id: 'b1', type: 'footnote', name: 'note', footnoteTextSpacing: 'none', text: 'body', marks: [] },
    { id: 'b1-2', type: 'paragraph', text: '', marks: [] },
  ])
})

test('Bear typed footnote definition marker inside a footnote edits source marker', () => {
  const looseState = textSelectionState('[^1]: [^note]:body', 'md-1', '[^note]:'.length)
  assert.equal(
    markdownAfter(looseState, blockShortcutTransaction(looseState, looseState.selection.from, looseState.selection.from, ' ')),
    '[^note]: body',
  )

  const tightState = textSelectionState('[^1]: [^tight]body', 'md-1', '[^tight]'.length)
  assert.equal(
    markdownAfter(tightState, blockShortcutTransaction(tightState, tightState.selection.from, tightState.selection.from, ':')),
    '[^tight]:body',
  )
})

test('Bear footnote marker backspace removes hidden definition syntax', () => {
  const looseState = textSelectionState('[^note]: body', 'md-1', 0)
  assert.equal(markdownAfter(looseState, backspaceBlockTransaction(looseState)), 'body')
  assert.deepEqual(blocksAfter(looseState, backspaceBlockTransaction(looseState)), [
    { id: 'md-1', type: 'paragraph', text: 'body', marks: [] },
  ])

  const tightState = textSelectionState('[^note]:body', 'md-1', 0)
  assert.equal(markdownAfter(tightState, backspaceBlockTransaction(tightState)), 'body')
  assert.deepEqual(blocksAfter(tightState, backspaceBlockTransaction(tightState)), [
    { id: 'md-1', type: 'paragraph', text: 'body', marks: [] },
  ])
})

test('Bear multiline footnote definitions stay one Markdown-visible block', () => {
  const markdown = 'Footnote ref[^1]\n\n[^1]: first\n    continued\n\tTabbed'
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(document.blocks[1], {
    id: 'md-2',
    type: 'footnote',
    name: '1',
    footnoteContinuationIndents: ['    ', '\t'],
    text: 'first\ncontinued\nTabbed',
    marks: [],
  })
  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.equal(nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(prosemirrorDocFromNano(document)) }), markdown)
})

test('Bear footnote continuation indentation feels editable through input and backspace', () => {
  const continuationState = textSelectionState('[^1]: first\n    continued', 'md-1', 'first\n'.length)
  assert.equal(
    markdownAfter(continuationState, blockShortcutTransaction(continuationState, continuationState.selection.from, continuationState.selection.from, ' ')),
    '[^1]: first\n     continued',
  )

  const wideContinuationState = textSelectionState('[^1]: first\n     continued', 'md-1', 'first\n'.length)
  assert.equal(markdownAfter(wideContinuationState, backspaceBlockTransaction(wideContinuationState)), '[^1]: first\n    continued')
})

test('Bear enter trims footnote continuation attrs to remaining source lines', () => {
  const firstLineState = textSelectionState('[^1]: first\n    continued\n\tTabbed', 'md-1', 'first'.length)
  const firstLineTransaction = enterBlockTransaction(firstLineState)

  assert.equal(markdownAfter(firstLineState, firstLineTransaction), '[^1]: first\n\ncontinued\nTabbed')
  assert.deepEqual(blocksAfter(firstLineState, firstLineTransaction), [
    { id: 'md-1', type: 'footnote', name: '1', text: 'first', marks: [] },
    { id: 'md-1-2', type: 'paragraph', text: 'continued\nTabbed', marks: [] },
  ])

  const secondLineState = textSelectionState('[^1]: first\n    continued\n\tTabbed', 'md-1', 'first\ncontinued'.length)
  const secondLineTransaction = enterBlockTransaction(secondLineState)

  assert.equal(markdownAfter(secondLineState, secondLineTransaction), '[^1]: first\n    continued\n\nTabbed')
  assert.deepEqual(blocksAfter(secondLineState, secondLineTransaction), [
    { id: 'md-1', type: 'footnote', name: '1', text: 'first\ncontinued', marks: [] },
    { id: 'md-1-2', type: 'paragraph', text: 'Tabbed', marks: [] },
  ])
})
