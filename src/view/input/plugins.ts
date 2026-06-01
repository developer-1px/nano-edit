import { Plugin } from 'prosemirror-state'
import { sourceRevealPlugin } from '../../features/viewer-edit/source-reveal/plugin'
import {
  activeTableCellBlockId,
  tableCellEditPlugin,
  type TableCellEditActions,
} from '../../features/viewer-edit/table-cell-edit/table-cell-edit-plugin'
import { kitHasViewFeature } from '../../engine/editor-kit'
import { blockUiDecorations } from '../block-ui/index'
import { syncFoldIndicatorStates } from '../block-ui/fold-indicator'
import type { NanoViewContext } from '../runtime/context'
import type { NanoInputRuntime } from './runtime'
import type { NanoInputHandlers } from './handlers'

export function createNanoInputPlugins(
  ctx: NanoViewContext,
  handlers: NanoInputHandlers,
  tableCellActions: TableCellEditActions,
): NanoInputRuntime {
  return {
    activeBlockPlugin: () => activeBlockPlugin(ctx),
    blockClickPlugin: () => blockClickPlugin(handlers),
    historyInputPlugin: () => historyInputPlugin(handlers),
    sourceRevealPlugin: () => kitHasViewFeature(ctx.kit, 'source-reveal')
      ? sourceRevealPlugin(ctx.collapsedBlockIds)
      : emptyPlugin(),
    shortcutInputPlugin: () => shortcutInputPlugin(handlers),
    tableCellEditPlugin: () => kitHasViewFeature(ctx.kit, 'table-cell-edit')
      ? tableCellEditPlugin(tableCellActions)
      : emptyPlugin(),
  }
}

function emptyPlugin(): Plugin {
  return new Plugin({})
}

function historyInputPlugin(handlers: NanoInputHandlers): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        beforeinput: (_view, event) => handlers.handleBeforeInput(event as InputEvent),
      },
    },
  })
}

function shortcutInputPlugin(handlers: NanoInputHandlers): Plugin {
  return new Plugin({
    props: {
      handleTextInput: (view, from, to, text) => handlers.handleShortcutInput(view, from, to, text),
      handleDOMEvents: {
        blur: (view) => handlers.handleEditorBlur(view),
        copy: (view, event) => handlers.handleCopy(view, event as ClipboardEvent),
      },
      handlePaste: (view, event) => handlers.handlePaste(view, event),
    },
  })
}

function blockClickPlugin(handlers: NanoInputHandlers): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        click: (view, event) => handlers.handleEditorClick(view, event),
        keydown: (view, event) => handlers.handleEditorKeydown(view, event as KeyboardEvent),
        mousedown: (_view, event) => handlers.handleEditorMouseDown(event),
      },
    },
  })
}

function activeBlockPlugin(ctx: NanoViewContext): Plugin {
  return new Plugin({
    view: (view) => {
      syncFoldIndicatorStatesWithoutObserver(view)
      return {
        update: syncFoldIndicatorStatesWithoutObserver,
      }
    },
    props: {
      decorations: (state) =>
        kitHasViewFeature(ctx.kit, 'active-block-ui')
          ? blockUiDecorations(
            state,
            ctx.collapsedBlockIds,
            activeTableCellBlockId(state),
          )
          : null,
    },
  })
}

function syncFoldIndicatorStatesWithoutObserver(view: { dom: HTMLElement }): void {
  const observer = (view as { domObserver?: { start: () => void; stop: () => void } }).domObserver
  observer?.stop()
  try {
    syncFoldIndicatorStates(view.dom)
  } finally {
    observer?.start()
  }
}
