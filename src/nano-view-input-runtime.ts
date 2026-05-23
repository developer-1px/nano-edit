import { Plugin } from 'prosemirror-state'
import type { MarkOption } from './nano-mark-options'
import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterRuntime } from './nano-view-gutter-runtime'
import type { NanoInspectorRuntime } from './nano-view-inspector-runtime'
import { createNanoInputClickHandlers } from './nano-view-input-click-events'
import { createNanoInputPlugins } from './nano-view-input-plugins'
import { createNanoInputTextHandlers } from './nano-view-input-text-events'

export interface NanoInputActions {
  restoreHistory: (direction: 'undo' | 'redo') => void
  runMarkCommand: (option: MarkOption) => void
  toggleCollapsedBlock: (id: string) => void
}

export interface NanoInputRuntime {
  activeBlockPlugin: () => Plugin
  blockClickPlugin: () => Plugin
  historyInputPlugin: () => Plugin
  shortcutInputPlugin: () => Plugin
}

export function createNanoInputRuntime(
  ctx: NanoViewContext,
  gutter: NanoGutterRuntime,
  inspector: NanoInspectorRuntime,
  actions: NanoInputActions,
): NanoInputRuntime {
  return createNanoInputPlugins(ctx, gutter, {
    ...createNanoInputTextHandlers(ctx, actions),
    ...createNanoInputClickHandlers(inspector, actions),
  })
}
