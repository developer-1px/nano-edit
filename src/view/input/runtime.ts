import { Plugin } from 'prosemirror-state'
import type { MarkOption } from '../../marks/nano-mark-options'
import type { NanoViewContext } from '../runtime/context'
import type { NanoInspectorRuntime } from '../inspector/runtime'
import { createNanoInputClickHandlers } from './click-events'
import { createNanoInputPlugins } from './plugins'
import { createNanoInputTextHandlers } from './text-events'

export interface NanoInputActions {
  restoreHistory: (direction: 'undo' | 'redo') => void
  runMarkCommand: (option: MarkOption) => void
  toggleCollapsedBlock: (id: string) => void
}

export interface NanoInputRuntime {
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
