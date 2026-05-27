import * as h from './harness.mjs'
const { bearInlineMarkdown, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h
const { createNanoEditorKit, defaultNanoEditorKit, kitHasViewFeature, nanoCommands } = h

test('Editor part catalog exposes 49 usable assembly parts', () => {
  assert.equal(editorPartCatalog.length, 49)
  assert.equal(editorPartCatalogById.size, 49)

  const ids = new Set(editorPartCatalog.map((part) => part.id))
  assert.equal(ids.size, editorPartCatalog.length)

  for (const part of editorPartCatalog) {
    assert.match(part.id, /^[a-z]+[.][a-z0-9-]+$/)
    assert(part.label.length > 0)
    assert(part.summary.length >= 24)
    assert(part.surfaces.length > 0)
    for (const relatedId of part.pairsWith ?? []) {
      assert(editorPartCatalogById.has(relatedId), `${part.id} references missing ${relatedId}`)
    }
  }

  assert.equal(editorPartsByCategory('block').length, 16)
  assert.equal(editorPartsByCategory('inline').length, 11)
  assert.equal(editorPartsByCategory('index').length, 5)
})

test('Block capabilities assemble a basic todo editor surface', () => {
  assert.deepEqual(
    blockOptionsFromCapabilities([basicCapability, todoCapability]).map((option) => option.id),
    ['paragraph', 'heading-1', 'heading-2', 'heading-3', 'heading-4', 'heading-5', 'heading-6', 'todo'],
  )
  assert.equal(createTodoBlockSchema(NanoMarkSchema).parse({
    id: 't1',
    type: 'todo',
    checked: true,
    text: 'Done',
  }).indent, 0)
  assert.deepEqual(markdownTodoLine('* [X] Done')?.attrs, {
    checked: true,
    checkedMarker: 'X',
    indent: 0,
    indentText: undefined,
    marker: '*',
  })
  assert.equal(todoNodeAttrsFromBlock({
    id: 't1',
    type: 'todo',
    checked: true,
    checkedMarker: 'X',
    text: 'Done',
    marks: [],
  }).checkedMarker, 'X')
  assert.deepEqual(todoIndexEntryFromBlock({
    id: 't1',
    type: 'todo',
    checked: true,
    checkedMarker: 'X',
    text: 'Done',
    marks: [],
  }), {
    blockId: 't1',
    label: 'Done',
    checked: true,
    checkedMarker: 'X',
  })
})

test('Editor kit turns selected capabilities into block affordances', () => {
  const kit = createNanoEditorKit({
    id: 'nano.basic-only',
    capabilities: [basicCapability],
    viewFeatures: ['active-block-ui'],
  })

  assert.equal(kit.id, 'nano.basic-only')
  assert.deepEqual(
    kit.blockOptions.map((option) => option.id),
    ['paragraph', 'heading-1', 'heading-2', 'heading-3', 'heading-4', 'heading-5', 'heading-6'],
  )
  assert.equal(kitHasViewFeature(kit, 'source-reveal'), false)
  assert.equal(kitHasViewFeature(defaultNanoEditorKit, 'source-reveal'), true)
  assert.equal(defaultNanoEditorKit.blockOptions.some((option) => option.id === 'todo'), true)
})

test('Command registry uses the active editor kit block options', () => {
  const kit = createNanoEditorKit({ capabilities: [basicCapability] })
  const commandIds = nanoCommands({
    activeBlockId: 'b1',
    actions: noopCommandActions(),
    blockId: null,
    blockOptions: kit.blockOptions,
    canIndentBlock: () => false,
    canMoveBlock: () => false,
    hasTextSelection: false,
    mode: 'global',
  }).map((command) => command.id)

  assert(commandIds.includes('block:paragraph'))
  assert(commandIds.includes('block:heading-1'))
  assert.equal(commandIds.includes('block:todo'), false)
})

function noopCommandActions() {
  return {
    changeBlockById: () => undefined,
    copyMarkdown: () => undefined,
    deleteBlock: () => undefined,
    duplicateBlock: () => undefined,
    focusMarkdownSource: () => undefined,
    indentBlock: () => undefined,
    insertBlock: () => undefined,
    moveBlock: () => undefined,
    redo: () => undefined,
    runMark: () => undefined,
    showInspector: () => undefined,
    togglePinnedInspector: () => undefined,
    undo: () => undefined,
  }
}

test('zod-crud history restores Nano selection snapshots on undo and redo', () => {
  const engine = createNanoDocument({
    blocks: [{ id: 'b1', type: 'paragraph', text: 'alpha', marks: [] }],
  })
  const path = blockTextPointer(0)
  const before = point(path, 1)
  const after = point(path, 4)

  engine.selection?.restore(selectionSnap(before, before))
  const committed = engine.commit(
    [{ op: 'replace', path, value: 'alpha beta' }],
    {
      origin: 'regression',
      label: 'replace text',
      mergeKey: `text:${path}`,
      selection: selectionSnap(after, after),
    },
  )

  assert.equal(committed.ok, true)
  assert.equal(engine.value.blocks[0].text, 'alpha beta')
  assert.deepEqual(engine.selection?.snapshot().focus, after)

  assert.equal(engine.history.undo(), true)
  assert.equal(engine.value.blocks[0].text, 'alpha')
  assert.deepEqual(engine.selection?.snapshot().focus, before)

  assert.equal(engine.history.redo(), true)
  assert.equal(engine.value.blocks[0].text, 'alpha beta')
  assert.deepEqual(engine.selection?.snapshot().focus, after)
})
