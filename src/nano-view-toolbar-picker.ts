import {
  blockOptions,
} from './nano-block-options'
import { blockOptionTitle } from './nano-block-ui'
import { markToolbarOptions } from './nano-mark-options'
import type { BlockPickerMode, NanoViewContext } from './nano-view-context'
import {
  blockToolbarButtons,
  button,
} from './nano-view-toolbar-controls'
import type { NanoToolbarActions } from './nano-view-toolbar-types'

export function installToolbarBlockPicker(
  ctx: NanoViewContext,
  actions: NanoToolbarActions,
  toggleBlockPicker: (mode: BlockPickerMode) => void,
): HTMLElement[] {
  ctx.blockPicker.replaceChildren(
    ...blockOptions.map((option) => {
      const control = button(option.label, blockOptionTitle(option), () => actions.runBlockPickerTemplate(option.template))
      control.classList.add('block-picker-option')
      control.dataset.md = option.markdownTrigger ?? ''
      return control
    }),
  )
  return [
    ...markToolbarOptions().map((option) =>
      button(option.toolbar.label, option.toolbar.title, () => actions.runMarkCommand(option)),
    ),
    ...blockToolbarButtons((option) => button(
      option.toolbar.label,
      option.toolbar.title,
      () => actions.runBlockTemplate(option.template),
    )),
    button('¶', 'Change', () => toggleBlockPicker('convert')),
    button('+', 'Add', () => toggleBlockPicker('insert')),
    ctx.blockPicker,
  ]
}
