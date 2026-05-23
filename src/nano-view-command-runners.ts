import type { BlockTemplate } from './nano-block-options'
import type { IndentDirection, MoveDirection } from './nano-command-surface'
import {
  markCommand,
  type MarkOption,
} from './nano-mark-options'
import type { NanoViewContext } from './nano-view-context'
import { changeBlockByIdTransaction } from './nano-view-block-edit-transactions'
import type { NanoEngineRuntime } from './nano-view-engine-runtime'
import type { NanoInspectorRuntime } from './nano-view-inspector-runtime'
import type { NanoKeymapRuntime } from './nano-view-keymap-runtime'
import type { NanoToolbarRuntime } from './nano-view-toolbar-runtime'

export interface NanoViewCommandRunners {
  runChangeBlockById: (id: string, template: BlockTemplate) => void
  runBlockTemplate: (template: BlockTemplate) => void
  runBlockPickerTemplate: (template: BlockTemplate) => void
  runDeleteActiveBlock: () => void
  runDuplicateActiveBlock: () => void
  runFocusActiveMarkdownSource: () => void
  runIndentActiveBlock: (direction: IndentDirection) => void
  runInsertBlockAfterActive: (template: BlockTemplate) => void
  runMarkCommand: (option: MarkOption) => void
  runMoveActiveBlock: (direction: MoveDirection) => void
}

export function createNanoViewCommandRunners(
  ctx: NanoViewContext,
  keymaps: NanoKeymapRuntime,
  deps: {
    engine: () => NanoEngineRuntime
    inspector: NanoInspectorRuntime
    toolbar: () => NanoToolbarRuntime
  },
): NanoViewCommandRunners {
  const sync = () => deps.engine().syncSelectionFromDOM()
  const focus = () => ctx.view.focus()
  const close = () => deps.toolbar().closeBlockPicker()

  function runEditorCommand(command: () => boolean, options: { closeOnSuccess?: boolean } = {}): void {
    sync()
    if (!command()) return
    if (options.closeOnSuccess) close()
    focus()
  }

  function runMarkCommand(option: MarkOption): void {
    runEditorCommand(() => markCommand(option)(ctx.view.state, ctx.view.dispatch, ctx.view))
  }

  function runBlockTemplate(template: BlockTemplate): void {
    runEditorCommand(() => keymaps.changeActiveBlockCommand(template)(ctx.view.state, ctx.view.dispatch, ctx.view))
  }

  function runChangeBlockById(id: string, template: BlockTemplate): void {
    runEditorCommand(() => {
      const transaction = changeBlockByIdTransaction(ctx.view.state, id, template)
      if (!transaction) return false

      ctx.view.dispatch(transaction.scrollIntoView())
      return true
    })
  }

  function runInsertBlockAfterActive(template: BlockTemplate): void {
    runEditorCommand(
      () => keymaps.insertBlockAfterActiveCommand(template)(ctx.view.state, ctx.view.dispatch, ctx.view),
      { closeOnSuccess: true },
    )
  }

  function runChangeActiveBlock(template: BlockTemplate): void {
    runEditorCommand(
      () => keymaps.changeActiveBlockCommand(template)(ctx.view.state, ctx.view.dispatch, ctx.view),
      { closeOnSuccess: true },
    )
  }

  function runBlockPickerTemplate(template: BlockTemplate): void {
    if (ctx.blockPickerMode === 'convert') runChangeActiveBlock(template)
    else runInsertBlockAfterActive(template)
  }

  function runKeymapCommand(command: () => boolean): void {
    runEditorCommand(command, { closeOnSuccess: true })
  }

  return {
    runChangeBlockById,
    runBlockTemplate,
    runBlockPickerTemplate,
    runDeleteActiveBlock: () => runKeymapCommand(() => keymaps.deleteActiveBlockCommand()(ctx.view.state, ctx.view.dispatch, ctx.view)),
    runDuplicateActiveBlock: () => runKeymapCommand(() => keymaps.duplicateActiveBlockCommand()(ctx.view.state, ctx.view.dispatch, ctx.view)),
    runFocusActiveMarkdownSource: () => {
      sync()
      if (!deps.inspector.focusActiveMarkdownSource()) return
      close()
    },
    runIndentActiveBlock: (direction) => runKeymapCommand(() => keymaps.indentActiveBlockCommand(direction)(ctx.view.state, ctx.view.dispatch, ctx.view)),
    runInsertBlockAfterActive,
    runMarkCommand,
    runMoveActiveBlock: (direction) => runKeymapCommand(() => keymaps.moveActiveBlockCommand(direction)(ctx.view.state, ctx.view.dispatch, ctx.view)),
  }
}
