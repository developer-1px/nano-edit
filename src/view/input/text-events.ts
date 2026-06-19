import type { EditorView } from 'prosemirror-view'
import type { NanoViewContext } from '../runtime/context'
import { COMPOSITION_SHORTCUT_SUPPRESSION_MS } from '../runtime/context'
import type { MarkOption } from '../../marks/types'
import { markOptionForInputType } from '../../marks/queries'
import { markShortcutTransaction } from '../../marks/shortcut-transaction'
import {
  markdownCopyTextFromSelection,
} from '../markdown-source/copy'
import { markdownPasteTransaction } from '../markdown-source/paste'
import {
  blockShortcutTransaction,
  slashPickerBlockIdFromInput,
} from '../keyboard/shortcuts'
import { inlineSourceTokenTextInputTransaction } from '../keyboard/inline-boundary'
import { trailingReferenceMarkTransaction } from '../keyboard/trailing-reference'

type ClipboardDataReader = Pick<DataTransfer, 'getData'>
type ClipboardDataWriter = Pick<DataTransfer, 'setData'>

const MARKDOWN_MIME_TYPE = 'text/markdown'
const PLAIN_TEXT_MIME_TYPE = 'text/plain'

interface NanoInputTextActions {
  restoreHistory: (direction: 'undo' | 'redo') => void
  runMarkCommand: (option: MarkOption) => void
}

export function createNanoInputTextHandlers(ctx: NanoViewContext, actions: NanoInputTextActions) {
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
    if (shouldSuppressShortcutInput(ctx, view)) return false

    const sourceTokenTransaction = inlineSourceTokenTextInputTransaction(view.state, from, to, text)
    if (sourceTokenTransaction) {
      view.dispatch(sourceTokenTransaction.scrollIntoView())
      return true
    }

    const slashPickerBlockId = slashPickerBlockIdFromInput(view.state, from, to, text, ctx.blockRegistry)
    if (slashPickerBlockId) {
      ctx.shell.openCommandPalette('slash', slashPickerBlockId)
      return true
    }

    const markTransaction = markShortcutTransaction(view.state, from, to, text)
    if (markTransaction) {
      view.dispatch(markTransaction.scrollIntoView())
      return true
    }

    const transaction = blockShortcutTransaction(view.state, from, to, text, ctx.blockRegistry)
    if (!transaction) return false

    view.dispatch(transaction.scrollIntoView())
    return true
  }

  const handlePaste = (view: EditorView, event: ClipboardEvent): boolean => {
    if (!event.clipboardData) return false

    const text = markdownTextFromClipboardData(event.clipboardData)
    const transaction = markdownPasteTransaction(view.state, text, ctx.collapsedBlockIds, ctx.blockRegistry)
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

  const handleCompositionStart = (): boolean => {
    ctx.composing = true
    return false
  }

  const handleCompositionEnd = (): boolean => {
    ctx.composing = false
    ctx.lastCompositionAt = Date.now()
    return false
  }

  return {
    handleBeforeInput,
    handleCompositionEnd,
    handleCompositionStart,
    handleShortcutInput,
    handlePaste,
    handleCopy,
    handleEditorBlur,
  }
}

function shouldSuppressShortcutInput(ctx: NanoViewContext, view: EditorView): boolean {
  const viewComposition = (view as unknown as { composing?: boolean }).composing === true
  return ctx.composing
    || viewComposition
    || Date.now() - ctx.lastCompositionAt < COMPOSITION_SHORTCUT_SUPPRESSION_MS
}

function preventAndRestore(
  event: InputEvent,
  actions: NanoInputTextActions,
  direction: 'undo' | 'redo',
): boolean {
  event.preventDefault()
  actions.restoreHistory(direction)
  return true
}

function markdownTextFromClipboardData(data: ClipboardDataReader): string {
  return data.getData(MARKDOWN_MIME_TYPE) || data.getData(PLAIN_TEXT_MIME_TYPE)
}

function writeMarkdownTextToClipboardData(data: ClipboardDataWriter, markdown: string): void {
  data.setData(PLAIN_TEXT_MIME_TYPE, markdown)
  data.setData(MARKDOWN_MIME_TYPE, markdown)
}
