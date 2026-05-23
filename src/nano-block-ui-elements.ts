import type { BlockOption } from './nano-block-options'
import { blockOptionsForTypeahead } from './nano-block-ui-typeahead'
import type { GutterPickerAction } from './nano-block-ui-types'

export function blockInsertPickerElement(
  id: string,
  selectedOptionId: string | null,
  action: GutterPickerAction,
  query: string,
): HTMLElement {
  const options = blockOptionsForTypeahead(query)
  const picker = document.createElement('div')
  picker.className = 'nano-block-insert-picker'
  picker.contentEditable = 'false'
  picker.dataset.blockId = id
  picker.dataset.action = action
  picker.dataset.query = query
  picker.ariaLabel = action === 'insert' ? 'Add' : 'Change'
  picker.append(
    ...(options.length > 0
      ? options.map((option) => blockInsertOptionElement(id, option, selectedOptionId, action))
      : [blockInsertEmptyElement()]),
  )
  return picker
}

export function blockInsertEmptyElement(): HTMLElement {
  const element = document.createElement('span')
  element.className = 'nano-block-insert-empty'
  element.contentEditable = 'false'
  element.textContent = 'No block'
  return element
}

export function blockInsertOptionElement(
  id: string,
  option: BlockOption,
  selectedOptionId: string | null,
  action: GutterPickerAction,
): HTMLElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano-block-insert-option'
  button.contentEditable = 'false'
  button.dataset.blockId = id
  button.dataset.optionId = option.id
  button.dataset.label = option.label
  button.dataset.md = option.markdownTrigger ?? ''
  button.dataset.selected = String(option.id === selectedOptionId)
  button.dataset.action = action
  button.tabIndex = option.id === selectedOptionId ? 0 : -1
  button.title = blockOptionTitle(option)
  button.ariaLabel = blockOptionTitle(option)
  return button
}

export function blockOptionTitle(option: BlockOption): string {
  return option.title
}

export function blockAddElement(id: string): HTMLElement {
  const addButton = document.createElement('button')
  addButton.type = 'button'
  addButton.className = 'nano-block-add'
  addButton.contentEditable = 'false'
  addButton.dataset.blockId = id
  addButton.title = 'Add'
  addButton.ariaLabel = 'Add'
  return addButton
}

export function blockHandleElement(id: string): HTMLElement {
  const handle = document.createElement('span')
  handle.className = 'nano-block-handle'
  handle.contentEditable = 'false'
  handle.draggable = true
  handle.dataset.blockId = id
  handle.title = 'Move'
  handle.ariaLabel = 'Move'
  handle.setAttribute('aria-hidden', 'true')
  return handle
}
