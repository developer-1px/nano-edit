import type { EditorView } from 'prosemirror-view'
import type { NanoViewContext } from './nano-view-context'
import type { NanoInputActions } from './nano-view-input-runtime'
import {
  markOptionForInputType,
  markShortcutTransaction,
} from '../marks/nano-mark-options'
import {
  markdownCopyTextFromSelection,
  markdownPasteTransaction,
} from './nano-view-markdown-transactions'
import {
  markdownTextFromClipboardData,
  writeMarkdownTextToClipboardData,
} from './nano-view-clipboard-data'
import {
  blockShortcutTransaction,
  inlineSourceTokenTextInputTransaction,
  slashPickerBlockIdFromInput,
  trailingReferenceMarkTransaction,
} from './nano-view-keyboard-transactions'

export function createNanoInputTextHandlers(ctx: NanoViewContext, actions: NanoInputActions) {
  const handleBeforeInput = (event: InputEvent): boolean => {
    if (event.inputType === 'historyUndo') return preventAndRestore(event, actions, 'undo')
    if (event.inputType === 'historyRedo') return preventAndRestore(event, actions, 'redo')

    const markOption = markOptionForInputType(event.inputType)
    if (!markOption) return false

    event.preventDefault()
    actions.runMarkCommand(markOption)
    return true
  }

  const handleShortcutInput = (view: EditorView, from: number, to: number, text: string): boolean => {
    const sourceTokenTransaction = inlineSourceTokenTextInputTransaction(view.state, from, to, text)
    if (sourceTokenTransaction) {
      view.dispatch(sourceTokenTransaction.scrollIntoView())
      return true
    }

    const slashPickerBlockId = slashPickerBlockIdFromInput(view.state, from, to, text)
    if (slashPickerBlockId) {
      ctx.shell.openCommandPalette('slash', slashPickerBlockId)
      return true
    }

    const markTransaction = markShortcutTransaction(view.state, from, to, text)
    if (markTransaction) {
      view.dispatch(markTransaction.scrollIntoView())
      return true
    }

    const transaction = blockShortcutTransaction(view.state, from, to, text)
    if (!transaction) return false

    view.dispatch(transaction.scrollIntoView())
    return true
  }

  const handlePaste = (view: EditorView, event: ClipboardEvent): boolean => {
    if (!event.clipboardData) return false

    const text = markdownTextFromClipboardData(event.clipboardData)
    const transaction = markdownPasteTransaction(view.state, text, ctx.collapsedBlockIds)
    if (!transaction) return false

    event.preventDefault()
    view.dispatch(transaction.scrollIntoView())
    return true
  }

  const handleCopy = (view: EditorView, event: ClipboardEvent): boolean => {
    const markdown = markdownCopyTextFromSelection(view.state, ctx.collapsedBlockIds)
    if (!markdown || !event.clipboardData) return false

    event.preventDefault()
    writeMarkdownTextToClipboardData(event.clipboardData, markdown)
    return true
  }

  const handleEditorBlur = (view: EditorView): boolean => {
    const transaction = trailingReferenceMarkTransaction(view.state)
    if (transaction) view.dispatch(transaction)
    return false
  }

  return { handleBeforeInput, handleShortcutInput, handlePaste, handleCopy, handleEditorBlur }
}

function preventAndRestore(
  event: InputEvent,
  actions: NanoInputActions,
  direction: 'undo' | 'redo',
): boolean {
  event.preventDefault()
  actions.restoreHistory(direction)
  return true
}
