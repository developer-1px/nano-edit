import * as h from './harness.mjs'
import { blockMoveUnitFromRanges } from '../../src/view/block-move/unit.ts'
import { positionForTopLevelRangeIndex } from '../../src/view/block-move/reorder.ts'
import { duplicateActiveBlockTransaction } from '../../src/view/block-edit/duplicate-delete.ts'
import {
  generatedBlockId,
  nextUnusedBlockId,
} from '../../src/capabilities/block-behavior-id.ts'
const { inlineMarkdownFixture, assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec, test, textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } = h

test('Collapsed list subtrees behave as one block unit', () => {
  const state = selectedState('- parent\n  - child\n- sibling', 'md-1')
  const collapsed = new Set(['md-1'])

  assert.equal(markdownCopyTextFromSelection(state, collapsed), '- parent\n  - child')
  assert.equal(selectedBlockText(state, selectAdjacentBlockTransaction(state, 'down', collapsed)), 'sibling')
  assert.equal(markdownAfter(state, deleteActiveBlockTransaction(state, collapsed)), '- sibling')
  assert.equal(markdownAfter(state, moveActiveBlockTransaction(state, 'down', collapsed)), '- sibling\n- parent\n  - child')
})

test('Duplicated list subtrees receive unique copied block ids', () => {
  const state = selectedState('- parent\n  - child', 'md-1')
  const blocks = blocksAfter(state, duplicateActiveBlockTransaction(state))

  assert.deepEqual(blocks.map((block) => block.id), ['md-1', 'md-2', 'md-1-2', 'md-2-2'])
  assert.equal(markdownAfter(state, duplicateActiveBlockTransaction(state)), '- parent\n  - child\n- parent\n  - child')
})

test('Block shortcut fallback ids are generated instead of fixed literals', () => {
  const doc = nanoSchema.nodes.doc.create(null, [
    nanoSchema.nodes.paragraph.create({ id: null }, nanoSchema.text('-')),
  ])
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 2),
  })
  const [block] = blocksAfter(state, blockShortcutTransaction(state, 2, 2, ' '))

  assert.match(block.id, /^b[a-z0-9]+-shortcut$/)
  assert.notEqual(block.id, 'b-shortcut')
})

test('Fallback block id prefixes advance within the same timestamp', () => {
  const now = Date.now
  Date.now = () => 123456
  try {
    const first = generatedBlockId(null, 'fallback')
    const second = generatedBlockId(null, 'fallback')
    const unusedFirst = nextUnusedBlockId(new Set(), null)
    const unusedSecond = nextUnusedBlockId(new Set(), null)

    assert.match(first, /^b2n9c[a-z0-9]+-fallback$/)
    assert.match(second, /^b2n9c[a-z0-9]+-fallback$/)
    assert.notEqual(first, second)
    assert.notEqual(unusedFirst, unusedSecond)
  } finally {
    Date.now = now
  }
})

test('Block reorder position lookup rejects invalid range indexes', () => {
  const ranges = [
    { node: { nodeSize: 3 } },
    { node: { nodeSize: 5 } },
  ]

  assert.equal(positionForTopLevelRangeIndex(ranges, -1), null)
  assert.equal(positionForTopLevelRangeIndex(ranges, 0), 0)
  assert.equal(positionForTopLevelRangeIndex(ranges, 1), 3)
  assert.equal(positionForTopLevelRangeIndex(ranges, 2), 8)
  assert.equal(positionForTopLevelRangeIndex(ranges, 3), null)
})

test('Block move unit creation rejects empty range lists', () => {
  const ranges = [
    { from: 2, to: 5, node: { nodeSize: 3 } },
    { from: 5, to: 9, node: { nodeSize: 4 } },
  ]

  assert.equal(blockMoveUnitFromRanges([]), null)
  assert.deepEqual(blockMoveUnitFromRanges(ranges), {
    from: 2,
    to: 9,
    ranges,
  })
})
