import { Plugin } from 'prosemirror-state'
import {
  sourceRevealPluginKey,
  unfocusedSourceRevealState,
  type SourceRevealPluginState,
} from './nano-source-reveal-state'
import { sourceRevealDecorations } from './nano-source-reveal-decorations'
import {
  clearActiveSourceTokenClasses,
  handleVisualSourceTokenMouseDown,
  scheduleActiveSourceTokenClassSync,
} from './nano-source-reveal-dom'

export { sourceRevealDecorations } from './nano-source-reveal-decorations'
export {
  sourceRevealPluginKey,
  type SourceRevealPluginState,
} from './nano-source-reveal-state'

export function sourceRevealPlugin(collapsedBlockIds: ReadonlySet<string>): Plugin<SourceRevealPluginState> {
  return new Plugin<SourceRevealPluginState>({
    key: sourceRevealPluginKey,
    state: {
      init: () => unfocusedSourceRevealState,
      apply: (transaction, value) => {
        const next = transaction.getMeta(sourceRevealPluginKey) as Partial<SourceRevealPluginState> | undefined
        return next ? { ...value, ...next } : value
      },
    },
    props: {
      decorations: (state) => sourceRevealDecorations(
        state,
        sourceRevealPluginKey.getState(state) ?? unfocusedSourceRevealState,
        collapsedBlockIds,
      ),
      handleDOMEvents: {
        focus: (view) => {
          view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: true }))
          return false
        },
        blur: (view) => {
          view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: false }))
          return false
        },
        mousedown: (view, event) => handleVisualSourceTokenMouseDown(view, event),
      },
    },
    view: (view) => {
      scheduleActiveSourceTokenClassSync(view)
      return {
        update: scheduleActiveSourceTokenClassSync,
        destroy: () => clearActiveSourceTokenClasses(view.dom),
      }
    },
  })
}
