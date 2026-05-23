import { activeBlockId } from './nano-view-active-block'
import type { NanoViewContext } from './nano-view-context'
import { slashPickerBlockIdFromSelection } from './nano-view-keyboard-transactions'

interface NanoGutterKeyboardRuntime {
  handleBlockInsertKeydown: (event: KeyboardEvent) => void
}

export function createNanoGutterKeyboardRuntime(
  ctx: NanoViewContext,
): NanoGutterKeyboardRuntime {
  const handleBlockInsertKeydown = (event: KeyboardEvent): void => {
    if (event.key !== '/') return

    const blockId = slashPickerBlockIdFromSelection(ctx.view.state)
      ?? (!ctx.view.state.selection.empty ? activeBlockId(ctx.view.state) : null)
    if (!blockId) return
    event.preventDefault()
    event.stopPropagation()
    ctx.shell.openCommandPalette('slash', blockId)
  }

  return { handleBlockInsertKeydown }
}
