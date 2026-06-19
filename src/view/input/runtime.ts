import { Plugin } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { withoutProseMirrorDomObserver } from '../../adapters/prosemirror/prosemirror-dom-observer'
import { sourceRevealPlugin } from '../../features/viewer-edit/source-reveal/plugin'
import {
  activeTableCellBlockId,
  tableCellEditPlugin,
  type TableCellEditActions,
} from '../../features/viewer-edit/table-cell-edit/table-cell-edit-plugin'
import { kitHasViewFeature } from '../../engine/editor-kit'
import type { MarkOption } from '../../marks/types'
import { blockUiDecorations } from '../block-ui/decorations'
import { syncFoldIndicatorStates } from '../block-ui/fold-indicator'
import type { NanoViewContext } from '../runtime/context'
import type { NanoInspectorRuntime } from '../inspector/runtime'
import {
  isClipboardEvent,
  isInputEvent,
  isKeyboardEvent,
} from '../dom-events'
import { createNanoInputClickHandlers } from './click-events'
import { createNanoInputTextHandlers } from './text-events'

interface NanoInputActions {
  restoreHistory: (direction: 'undo' | 'redo') => void
  runMarkCommand: (option: MarkOption) => void
  toggleCollapsedBlock: (id: string) => void
}

interface NanoInputRuntime {
  activeBlockPlugin: () => Plugin
  blockClickPlugin: () => Plugin
  historyInputPlugin: () => Plugin
  sourceRevealPlugin: () => Plugin
  shortcutInputPlugin: () => Plugin
  tableCellEditPlugin: () => Plugin
}

export function createNanoInputRuntime(
  ctx: NanoViewContext,
  inspector: NanoInspectorRuntime,
  actions: NanoInputActions,
): NanoInputRuntime {
  return createNanoInputPlugins(ctx, {
    ...createNanoInputTextHandlers(ctx, actions),
    ...createNanoInputClickHandlers(ctx, inspector, actions),
  }, {
    restoreHistory: actions.restoreHistory,
  })
}

interface NanoInputHandlers {
  handleBeforeInput: (event: InputEvent) => boolean
  handleCompositionEnd: () => boolean
  handleCompositionStart: () => boolean
  handleCopy: (view: EditorView, event: ClipboardEvent) => boolean
  handleEditorBlur: (view: EditorView) => boolean
  handleEditorClick: (view: EditorView, event: MouseEvent) => boolean
  handleEditorKeydown: (view: EditorView, event: KeyboardEvent) => boolean
  handleEditorMouseDown: (event: MouseEvent) => boolean
  handlePaste: (view: EditorView, event: ClipboardEvent) => boolean
  handleShortcutInput: (view: EditorView, from: number, to: number, text: string) => boolean
}

function createNanoInputPlugins(
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
        beforeinput: (_view, event) => isInputEvent(event) && handlers.handleBeforeInput(event),
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
        compositionend: () => handlers.handleCompositionEnd(),
        compositionstart: () => handlers.handleCompositionStart(),
        copy: (view, event) => isClipboardEvent(event) && handlers.handleCopy(view, event),
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
        keydown: (view, event) => isKeyboardEvent(event) && handlers.handleEditorKeydown(view, event),
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
  withoutProseMirrorDomObserver(view, () => syncFoldIndicatorStates(view.dom))
}
