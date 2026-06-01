import type { BlockTemplate } from '../../blocks/nano-block-options'
import type { IndentDirection, MoveDirection } from '../shell/shell'
import {
  markCommand,
  type MarkOption,
} from '../../marks/nano-mark-options'
import type { NanoViewContext } from './context'
import { changeBlockByIdTransaction } from '../block-edit/index'
import type { NanoEngineRuntime } from '../engine/runtime'
import type { NanoInspectorRuntime } from '../inspector/runtime'
import type { NanoKeymapRuntime } from '../keyboard/runtime'

export interface NanoViewCommandRunners {
  runChangeBlockById: (id: string, template: BlockTemplate) => void
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
  },
): NanoViewCommandRunners {
  const sync = () => deps.engine().syncSelectionFromDOM()
  const focus = () => ctx.view.focus()

  function runEditorCommand(command: () => boolean): void {
    sync()
    if (!command()) return
    focus()
  }

  function runMarkCommand(option: MarkOption): void {
    runEditorCommand(() => markCommand(option)(ctx.view.state, ctx.view.dispatch, ctx.view))
  }

  function runChangeBlockById(id: string, template: BlockTemplate): void {
    runEditorCommand(() => {
      const transaction = changeBlockByIdTransaction(ctx.view.state, id, template, ctx.blockRegistry)
      if (!transaction) return false

      ctx.view.dispatch(transaction.scrollIntoView())
      return true
    })
  }

  function runInsertBlockAfterActive(template: BlockTemplate): void {
    runEditorCommand(() => keymaps.insertBlockAfterActiveCommand(template)(ctx.view.state, ctx.view.dispatch, ctx.view))
  }

  function runKeymapCommand(command: () => boolean): void {
    runEditorCommand(command)
  }

  return {
    runChangeBlockById,
    runDeleteActiveBlock: () => runKeymapCommand(() => keymaps.deleteActiveBlockCommand()(ctx.view.state, ctx.view.dispatch, ctx.view)),
    runDuplicateActiveBlock: () => runKeymapCommand(() => keymaps.duplicateActiveBlockCommand()(ctx.view.state, ctx.view.dispatch, ctx.view)),
    runFocusActiveMarkdownSource: () => {
      sync()
      deps.inspector.focusActiveMarkdownSource()
    },
    runIndentActiveBlock: (direction) => runKeymapCommand(() => keymaps.indentActiveBlockCommand(direction)(ctx.view.state, ctx.view.dispatch, ctx.view)),
    runInsertBlockAfterActive,
    runMarkCommand,
    runMoveActiveBlock: (direction) => runKeymapCommand(() => keymaps.moveActiveBlockCommand(direction)(ctx.view.state, ctx.view.dispatch, ctx.view)),
  }
}
