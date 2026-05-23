import {
  blockInsertPickerDirection,
  blockInsertPickerTypeaheadKey,
} from './nano-block-ui'
import { activeBlockId } from './nano-view-active-block'
import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterPickerRuntime } from './nano-view-gutter-picker-runtime'
import { slashPickerBlockIdFromSelection } from './nano-view-keyboard-transactions'

interface NanoGutterKeyboardRuntime {
  handleBlockInsertKeydown: (event: KeyboardEvent) => void
}

export function createNanoGutterKeyboardRuntime(
  ctx: NanoViewContext,
  picker: NanoGutterPickerRuntime,
): NanoGutterKeyboardRuntime {
  const handleBlockInsertKeydown = (event: KeyboardEvent): void => {
    if (!ctx.gutterPickerBlockId) {
      if (event.key !== '/') return

      const blockId = slashPickerBlockIdFromSelection(ctx.view.state)
        ?? (!ctx.view.state.selection.empty ? activeBlockId(ctx.view.state) : null)
      if (!blockId) return

      event.preventDefault()
      event.stopPropagation()
      ctx.shell.openCommandPalette('slash', blockId)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      picker.closeGutterPicker()
      return
    }

    const direction = blockInsertPickerDirection(event.key)
    if (direction) {
      event.preventDefault()
      event.stopPropagation()
      picker.selectAdjacentGutterOption(direction)
      return
    }

    if (event.key === 'Backspace' && ctx.gutterPickerTypeahead) {
      event.preventDefault()
      event.stopPropagation()
      picker.deleteGutterPickerTypeahead()
      return
    }

    if (event.key === ' ' && ctx.gutterPickerTypeahead) {
      runSelectedGutterOption(event)
      return
    }

    const typeaheadKey = blockInsertPickerTypeaheadKey(event)
    if (typeaheadKey) {
      event.preventDefault()
      event.stopPropagation()
      picker.selectGutterOptionByTypeahead(typeaheadKey)
      return
    }

    if (event.key === 'Enter') runSelectedGutterOption(event)
  }

  const runSelectedGutterOption = (event: KeyboardEvent): void => {
    const blockId = ctx.gutterPickerBlockId
    const action = ctx.gutterPickerAction
    const option = picker.selectedGutterOption()
    if (!blockId || !option || !action) return

    event.preventDefault()
    event.stopPropagation()
    picker.runGutterPickerAction(blockId, option.template, action)
  }

  return { handleBlockInsertKeydown }
}
