import { activeBlockId } from '../selection/active-block'
import {
  canIndentActiveBlock,
  canMoveActiveBlock,
} from '../block-move/transactions'
import {
  createNanoShell,
  type NanoShell,
} from '../shell/shell'
import { nanoCommands } from '../../commands/registry'
import type { NanoViewCommandRunners } from './command-runners'
import type {
  NanoViewContext,
  NanoViewOptions,
} from './context'
import type { NanoEngineRuntime } from '../engine/runtime'
import type { NanoInspectorRuntime } from '../inspector/runtime'
import { nanoCommandAnchorRect } from './editor-state'

export function installNanoShell(
  options: NanoViewOptions,
  ctx: NanoViewContext,
  deps: {
    engine: () => NanoEngineRuntime
    inspector: NanoInspectorRuntime
    runners: NanoViewCommandRunners
  },
): void {
  prepareNanoRoot(ctx)
  let shell: NanoShell | null = null
  const createdShell = createNanoShell({
    commandAnchorRect: () => nanoCommandAnchorRect(ctx),
    commands: (context) => {
      const state = ctx.view.state
      return nanoCommands({
        activeBlockId: activeBlockId(state),
        blockId: context.blockId,
        blockOptions: ctx.kit.blockOptions,
        canIndentBlock: (direction) => canIndentActiveBlock(state, direction, ctx.collapsedBlockIds),
        canMoveBlock: (direction) => canMoveActiveBlock(state, direction, ctx.collapsedBlockIds),
        hasTextSelection: !state.selection.empty,
        mode: context.mode,
        actions: {
          changeBlockById: deps.runners.runChangeBlockById,
          copyMarkdown: () => deps.engine().copyMarkdown(),
          deleteBlock: deps.runners.runDeleteActiveBlock,
          duplicateBlock: deps.runners.runDuplicateActiveBlock,
          focusMarkdownSource: deps.runners.runFocusActiveMarkdownSource,
          indentBlock: deps.runners.runIndentActiveBlock,
          insertBlock: deps.runners.runInsertBlockAfterActive,
          moveBlock: deps.runners.runMoveActiveBlock,
          redo: () => deps.engine().restoreHistory('redo'),
          runMark: deps.runners.runMarkCommand,
          showInspector: (tab) => shell?.showInspector(tab),
          togglePinnedInspector: () => {
            shell?.setInspectorMode(ctx.root.dataset.inspector === 'pinned' ? 'floating' : 'pinned')
          },
          undo: () => deps.engine().restoreHistory('undo'),
        },
      })
    },
    onCommandClose: () => ctx.view.focus(),
    onIndexSearch: (query) => {
      ctx.indexSearchQuery = query
      deps.inspector.renderIndex()
    },
    root: ctx.root,
  })
  shell = createdShell
  ctx.shell = createdShell
  ctx.indexOutput = ctx.shell.indexOutput
  ctx.markdownOutput = ctx.shell.markdownOutput
  ctx.root.append(
    ctx.editor,
    ctx.shell.inspectorElement,
    ctx.shell.inspectorTrigger,
    ctx.shell.commandPalette,
  )
  options.mount.replaceChildren(ctx.root)
}

function prepareNanoRoot(ctx: NanoViewContext): void {
  ctx.root = document.createElement('section')
  ctx.root.className = 'nano'
  ctx.editor = document.createElement('div')
  ctx.editor.className = 'nano-editor'
}
