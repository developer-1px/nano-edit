import assert from 'node:assert/strict'
import { AllSelection, EditorState, NodeSelection, TextSelection } from 'prosemirror-state'
import { editorPartCatalog, editorPartCatalogById, editorPartsByCategory } from '../../src/assembly/part-catalog.ts'
import { blockOptionsFromCapabilities } from '../../src/assembly/capability.ts'
import { basicCapability } from '../../src/capabilities/basic/capability.ts'
import { todoCapability } from '../../src/capabilities/todo/capability.ts'
import { nanoCommands } from '../../src/commands/registry.ts'
import { defaultNanoEditorKit } from '../../src/engine/default-kit.ts'
import { describeNanoCapabilityProfile } from '../../src/engine/capability-profile.ts'
import { createNanoEditorKit, kitHasViewFeature } from '../../src/engine/editor-kit.ts'
import { todoIndexEntryFromBlock } from '../../src/capabilities/todo/indexing.ts'
import { markdownTodoLine } from '../../src/capabilities/todo/markdown.ts'
import { todoNodeAttrsFromBlock } from '../../src/capabilities/todo/prosemirror.ts'
import { createTodoBlockSchema } from '../../src/capabilities/todo/schema.ts'
import { nanoDocumentIndex, nanoDocumentSearch } from '../../src/indexing/nano-document-index.ts'
import { markShortcutTransaction } from '../../src/marks/shortcut-transaction.ts'
import { nanoDocumentFromMarkdown, nanoMarkdownFromDocument } from '../../src/codecs/markdown/nano-markdown.ts'
import { createNanoDocument } from '../../src/entities/document/nano-document.ts'
import { NanoMarkSchema } from '../../src/entities/mark/nano-mark-schema.ts'
import {
  blockTextPointer,
  point,
  selectionSnap,
} from '../../src/entities/document/nano-document-selection.ts'
import {
  backspaceBlockTransaction,
  deleteBlockSyntaxTransaction,
  enterBlockTransaction,
  enterListParentEndTransaction,
} from '../../src/view/keyboard/enter.ts'
import {
  blockEnterShortcutTransaction,
  blockShortcutTransaction,
} from '../../src/view/keyboard/shortcuts.ts'
import {
  changeActiveBlockTransaction,
  changeBlockByIdTransaction,
} from '../../src/view/block-edit/change.ts'
import {
  deleteActiveBlockTransaction,
} from '../../src/view/block-edit/duplicate-delete.ts'
import {
  selectAdjacentBlockTransaction,
} from '../../src/view/block-edit/selection.ts'
import {
  canIndentActiveBlock,
} from '../../src/view/block-move/checks.ts'
import {
  indentActiveBlockTransaction,
  moveActiveBlockTransaction,
  moveBlockToTargetTransaction,
} from '../../src/view/block-move/transactions.ts'
import {
  inlineMarkBoundaryTransaction,
  inlineSourceTokenDeleteTransaction,
  inlineSourceTokenTextInputTransaction,
} from '../../src/view/keyboard/inline-boundary.ts'
import {
  markdownBlockSourceTransaction,
} from '../../src/view/markdown-source/source-transaction.ts'
import {
  markdownCopyTextFromSelection,
} from '../../src/view/markdown-source/copy.ts'
import {
  markdownPasteTransaction,
} from '../../src/view/markdown-source/paste.ts'
import {
  selectedAtomSourceTransaction,
} from '../../src/view/markdown-source/selected-atom.ts'
import {
  trailingReferenceMarkTransaction,
} from '../../src/view/keyboard/trailing-reference.ts'
import {
  externalHrefFromMarkdownLink,
} from '../../src/view/references/external.ts'
import {
  nanoBlocksFromProseMirror,
  prosemirrorDocFromNano,
} from '../../src/adapters/prosemirror/prosemirror-document.ts'
import {
  nanoMarkNames,
  nanoNodeNames,
} from '../../src/adapters/prosemirror/prosemirror-names.ts'
import { nanoSchema } from '../../src/adapters/prosemirror/prosemirror-schema.ts'
import { rawMarkdownInlineDomSpec } from '../../src/adapters/prosemirror/prosemirror-raw-markdown.ts'
import {
  backspaceKeyCommand,
  deleteKeyCommand,
} from '../../src/view/keyboard/backspace.ts'

export const inlineMarkdownFixture = [
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


export { assert, AllSelection, EditorState, NodeSelection, TextSelection, editorPartCatalog, editorPartCatalogById, editorPartsByCategory, blockOptionsFromCapabilities, basicCapability, todoCapability, nanoCommands, createNanoEditorKit, defaultNanoEditorKit, describeNanoCapabilityProfile, kitHasViewFeature, todoIndexEntryFromBlock, markdownTodoLine, todoNodeAttrsFromBlock, createTodoBlockSchema, nanoDocumentIndex, nanoDocumentSearch, markShortcutTransaction, nanoDocumentFromMarkdown, nanoMarkdownFromDocument, blockTextPointer, createNanoDocument, NanoMarkSchema, point, selectionSnap, backspaceKeyCommand, blockEnterShortcutTransaction, blockShortcutTransaction, backspaceBlockTransaction, changeActiveBlockTransaction, changeBlockByIdTransaction, canIndentActiveBlock, deleteActiveBlockTransaction, deleteBlockSyntaxTransaction, deleteKeyCommand, enterBlockTransaction, enterListParentEndTransaction, externalHrefFromMarkdownLink, inlineMarkBoundaryTransaction, inlineSourceTokenDeleteTransaction, inlineSourceTokenTextInputTransaction, indentActiveBlockTransaction, markdownBlockSourceTransaction, markdownCopyTextFromSelection, markdownPasteTransaction, moveActiveBlockTransaction, moveBlockToTargetTransaction, selectAdjacentBlockTransaction, selectedAtomSourceTransaction, trailingReferenceMarkTransaction, nanoBlocksFromProseMirror, nanoMarkNames, nanoNodeNames, nanoSchema, prosemirrorDocFromNano, rawMarkdownInlineDomSpec }
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
