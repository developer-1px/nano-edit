import {
  blockToolbarOptions,
} from './nano-block-options'
import { activeBlockRange } from './nano-block-structure'
import {
  isMarkOptionActive,
  markToolbarOptions,
} from './nano-mark-options'
import type { NanoViewContext } from './nano-view-context'
import {
  canIndentActiveBlock,
  canMoveActiveBlock,
} from './nano-view-block-move-transactions'
import {
  blockToolbarActive,
  toolbarAction,
} from './nano-view-toolbar-controls'

export function refreshToolbarState(ctx: NanoViewContext): void {
  const state = ctx.view.state
  const block = activeBlockRange(state)?.node ?? null
  for (const option of markToolbarOptions()) {
    setToolbarActive(ctx, toolbarAction(option.toolbar), isMarkOptionActive(state, option))
  }
  for (const option of blockToolbarOptions()) {
    setToolbarActive(ctx, toolbarAction(option.toolbar), block ? blockToolbarActive(option, block) : false)
  }
  setToolbarDisabled(ctx, 'move block up', !canMoveActiveBlock(state, 'up', ctx.collapsedBlockIds))
  setToolbarDisabled(ctx, 'move block down', !canMoveActiveBlock(state, 'down', ctx.collapsedBlockIds))
  setToolbarDisabled(ctx, 'indent block', !canIndentActiveBlock(state, 'in', ctx.collapsedBlockIds))
  setToolbarDisabled(ctx, 'outdent block', !canIndentActiveBlock(state, 'out', ctx.collapsedBlockIds))
}

function setToolbarActive(ctx: NanoViewContext, action: string, active: boolean): void {
  const button = ctx.toolbar.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)
  if (!button) return
  button.dataset.active = String(active)
  button.setAttribute('aria-pressed', String(active))
}

function setToolbarDisabled(ctx: NanoViewContext, action: string, disabled: boolean): void {
  const button = ctx.toolbar.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)
  if (button) button.disabled = disabled
}
