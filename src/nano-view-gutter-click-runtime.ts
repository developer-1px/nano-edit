import { NodeSelection } from 'prosemirror-state'
import {
  blockAddFromEventTarget,
  blockHandleFromEventTarget,
  blockInsertOptionFromEventTarget,
  blockInsertPickerFromEventTarget,
} from './nano-block-ui'
import { blockPositionById } from './nano-block-structure'
import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterPickerRuntime } from './nano-view-gutter-picker-runtime'

interface NanoGutterClickRuntime {
  handleBlockAddClick: (event: MouseEvent) => void
  handleBlockHandleClick: (event: MouseEvent) => void
  handleBlockInsertHover: (event: MouseEvent) => void
  handleGutterOutsideClick: (event: MouseEvent) => void
}

export function createNanoGutterClickRuntime(
  ctx: NanoViewContext,
  picker: NanoGutterPickerRuntime,
): NanoGutterClickRuntime {
  const handleBlockAddClick = (event: MouseEvent): void => {
    const optionButton = blockInsertOptionFromEventTarget(event.target)
    if (optionButton) {
      picker.handleBlockInsertOptionClick(event, optionButton)
      return
    }

    const addButton = blockAddFromEventTarget(event.target)
    const id = addButton?.dataset.blockId
    if (!id) {
      if (ctx.gutterPickerBlockId && !blockInsertPickerFromEventTarget(event.target)) {
        picker.closeGutterPicker()
      }
      return
    }

    event.preventDefault()
    if (ctx.gutterPickerBlockId === id) {
      picker.closeGutterPicker()
      return
    }

    picker.openGutterPicker(id, 'insert')
    ctx.view.focus()
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
    if (blockAddFromEventTarget(event.target) || blockInsertPickerFromEventTarget(event.target)) return

    picker.closeGutterPicker()
  }

  const handleBlockHandleClick = (event: MouseEvent): void => {
    const handle = blockHandleFromEventTarget(event.target)
    const id = handle?.dataset.blockId
    if (!id) return

    const position = blockPositionById(ctx.view.state.doc, id)
    if (position === null) return

    event.preventDefault()
    picker.closeGutterPicker(false)
    ctx.view.dispatch(
      ctx.view.state.tr.setSelection(NodeSelection.create(ctx.view.state.doc, position)).scrollIntoView(),
    )
    ctx.view.focus()
  }

  return { handleBlockAddClick, handleBlockHandleClick, handleBlockInsertHover, handleGutterOutsideClick }
}
