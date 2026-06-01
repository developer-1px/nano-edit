import assert from 'node:assert/strict'
import { AllSelection, EditorState, NodeSelection, TextSelection } from 'prosemirror-state'
import { editorPartCatalog, editorPartCatalogById, editorPartsByCategory } from '../../src/assembly/part-catalog.ts'
import { blockOptionsFromCapabilities } from '../../src/assembly/registry.ts'
import { basicCapability } from '../../src/capabilities/basic/capability.ts'
import { todoCapability } from '../../src/capabilities/todo/capability.ts'
import { nanoCommands } from '../../src/commands/registry.ts'
import { createNanoEditorKit, defaultNanoEditorKit, kitHasViewFeature } from '../../src/engine/index.ts'
import { todoIndexEntryFromBlock } from '../../src/capabilities/todo/index.ts'
import { markdownTodoLine } from '../../src/capabilities/todo/markdown.ts'
import { todoNodeAttrsFromBlock } from '../../src/capabilities/todo/prosemirror.ts'
import { createTodoBlockSchema } from '../../src/capabilities/todo/schema.ts'
import { nanoDocumentIndex, nanoDocumentSearch } from '../../src/indexing/nano-document-index.ts'
import { markShortcutTransaction } from '../../src/marks/nano-mark-options.ts'
import { nanoDocumentFromMarkdown, nanoMarkdownFromDocument } from '../../src/codecs/markdown/nano-markdown.ts'
import {
  blockTextPointer,
  createNanoDocument,
  NanoMarkSchema,
  point,
  selectionSnap,
} from '../../src/core/nano-core.ts'
import {
  blockEnterShortcutTransaction,
  blockShortcutTransaction,
  backspaceBlockTransaction,
  changeActiveBlockTransaction,
  changeBlockByIdTransaction,
  canIndentActiveBlock,
  deleteActiveBlockTransaction,
  deleteBlockSyntaxTransaction,
  enterBlockTransaction,
  enterListParentEndTransaction,
  externalHrefFromMarkdownLink,
  inlineMarkBoundaryTransaction,
  inlineSourceTokenDeleteTransaction,
  inlineSourceTokenTextInputTransaction,
  indentActiveBlockTransaction,
  markdownBlockSourceTransaction,
  markdownCopyTextFromSelection,
  markdownPasteTransaction,
  moveActiveBlockTransaction,
  moveBlockToTargetTransaction,
  selectAdjacentBlockTransaction,
  selectedAtomSourceTransaction,
  trailingReferenceMarkTransaction,
} from '../../src/view/nano-view.ts'
import {
  nanoBlocksFromProseMirror,
  nanoMarkNames,
  nanoNodeNames,
  nanoSchema,
  prosemirrorDocFromNano,
  rawMarkdownInlineDomSpec,
} from '../../src/adapters/prosemirror/prosemirror-nano.ts'
import {
  backspaceKeyCommand,
  deleteKeyCommand,
} from '../../src/view/keyboard/backspace.ts'

export const bearInlineMarkdown = [
  '**bold**',
  '*italic*',
  '~under~',
  '~~strike~~',
  '==highlight==',
  '`code`',
  '#projects/editor',
  '#multi word tag#',
  '[[Block UI#Markdown Source|raw 편집]]',
  '[link](https://example.com)',
].join(' ')


export { assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, nanoCommands, createNanoEditorKit, defaultNanoEditorKit, kitHasViewFeature, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, backspaceKeyCommand, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, deleteBlockSyntaxTransaction, deleteKeyCommand, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, inlineMarkBoundaryTransaction, inlineSourceTokenDeleteTransaction, inlineSourceTokenTextInputTransaction, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, markdownPasteTransaction, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, selectedAtomSourceTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec }
export { textState, selectedState, allSelectedState, textSelectionState, blockAfterMarkShortcut, blockDomSpec, markDomSpec, domSpecHasClass, blocksAfter, markdownAfter, selectedBlockText, blockPositionById } from './harness-helpers.mjs'

export function test(name, run) {
  try {
    run()
    console.log(`ok ${name}`)
  } catch (error) {
    console.error(`not ok ${name}`)
    throw error
  }
}
