import {
  blockInsertOptionFromEventTarget,
  blockInsertPickerFromEventTarget,
} from './nano-block-ui'
import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterPickerRuntime } from './nano-view-gutter-picker-runtime'

interface NanoGutterClickRuntime {
  handleBlockInsertClick: (event: MouseEvent) => void
  handleBlockInsertHover: (event: MouseEvent) => void
  handleGutterOutsideClick: (event: MouseEvent) => void
}

export function createNanoGutterClickRuntime(
  ctx: NanoViewContext,
  picker: NanoGutterPickerRuntime,
): NanoGutterClickRuntime {
  const handleBlockInsertClick = (event: MouseEvent): void => {
    const optionButton = blockInsertOptionFromEventTarget(event.target)
    if (optionButton) {
      picker.handleBlockInsertOptionClick(event, optionButton)
      return
    }

    if (ctx.gutterPickerBlockId && !blockInsertPickerFromEventTarget(event.target)) picker.closeGutterPicker()
  }

  const handleBlockInsertHover = (event: MouseEvent): void => {
    if (!ctx.gutterPickerBlockId) return

    const optionId = blockInsertOptionFromEventTarget(event.target)?.dataset.optionId
    if (!optionId || optionId === ctx.gutterPickerOptionId) return

    ctx.gutterPickerOptionId = optionId
    picker.refreshBlockUi()
  }

  const handleGutterOutsideClick = (event: MouseEvent): void => {
    if (!ctx.gutterPickerBlockId) return
    if (blockInsertPickerFromEventTarget(event.target)) return

    picker.closeGutterPicker()
  }

  return { handleBlockInsertClick, handleBlockInsertHover, handleGutterOutsideClick }
}
