import { Plugin } from 'prosemirror-state'
import { blockUiDecorations, clearBlockDragState } from './nano-block-ui'
import { syncFoldIndicatorStates } from './nano-fold-indicator'
import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterRuntime } from './nano-view-gutter-runtime'
import type { NanoInputRuntime } from './nano-view-input-runtime'
import type { NanoInputHandlers } from './nano-view-input-handlers'

export function createNanoInputPlugins(
  ctx: NanoViewContext,
  gutter: NanoGutterRuntime,
  handlers: NanoInputHandlers,
): NanoInputRuntime {
  return {
    activeBlockPlugin: () => activeBlockPlugin(ctx, gutter),
    blockClickPlugin: () => blockClickPlugin(handlers),
    historyInputPlugin: () => historyInputPlugin(handlers),
    shortcutInputPlugin: () => shortcutInputPlugin(handlers),
  }
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

function activeBlockPlugin(ctx: NanoViewContext, gutter: NanoGutterRuntime): Plugin {
  return new Plugin({
    view: (view) => {
      syncFoldIndicatorStatesWithoutObserver(view)
      return {
        update: syncFoldIndicatorStatesWithoutObserver,
      }
    },
    props: {
      decorations: (state) =>
        blockUiDecorations(
          state,
          ctx.gutterPickerBlockId,
          ctx.gutterPickerOptionId,
          ctx.gutterPickerAction,
          ctx.gutterPickerTypeahead,
          ctx.collapsedBlockIds,
        ),
      handleDOMEvents: {
        dragstart: (view, event) => gutter.handleBlockDragStart(view, event as DragEvent),
        dragover: (view, event) => gutter.handleBlockDragOver(view, event as DragEvent),
        drop: (view, event) => gutter.handleBlockDrop(view, event as DragEvent),
        dragend: (view) => {
          clearBlockDragState(view.dom)
          return false
        },
      },
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
