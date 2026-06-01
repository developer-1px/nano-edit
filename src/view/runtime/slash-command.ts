import { activeBlockId } from '../selection/active-block'
import type { NanoViewContext } from './context'
import { slashPickerBlockIdFromSelection } from '../keyboard/transactions'

export interface NanoSlashCommandRuntime {
  handleSlashKeydown: (event: KeyboardEvent) => void
}

export function createNanoSlashCommandRuntime(
  ctx: NanoViewContext,
): NanoSlashCommandRuntime {
  const handleSlashKeydown = (event: KeyboardEvent): void => {
    if (event.key !== '/') return

    const blockId = slashPickerBlockIdFromSelection(ctx.view.state, ctx.blockRegistry)
      ?? (!ctx.view.state.selection.empty ? activeBlockId(ctx.view.state) : null)
    if (!blockId) return
    event.preventDefault()
    event.stopPropagation()
    ctx.shell.openCommandPalette('slash', blockId)
  }

  return { handleSlashKeydown }
}
