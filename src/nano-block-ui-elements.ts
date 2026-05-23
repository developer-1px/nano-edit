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
  const activeOption = options.find((option) => option.id === selectedOptionId) ?? options[0] ?? null
  const picker = document.createElement('div')
  const pickerId = `nano-block-picker-${domIdPart(id)}-${action}`
  picker.id = pickerId
  picker.className = 'nano-block-insert-picker'
  picker.contentEditable = 'false'
  picker.dataset.blockId = id
  picker.dataset.action = action
  picker.dataset.query = query
  picker.ariaLabel = action === 'insert' ? 'Add' : 'Change'
  picker.setAttribute('role', 'listbox')
  if (activeOption) picker.setAttribute('aria-activedescendant', blockInsertOptionDomId(pickerId, activeOption.id))
  picker.append(
    ...(options.length > 0
      ? options.map((option) => blockInsertOptionElement(id, option, activeOption?.id ?? null, action, pickerId))
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
  pickerId = `nano-block-picker-${domIdPart(id)}-${action}`,
): HTMLElement {
  const button = document.createElement('button')
  const selected = option.id === selectedOptionId
  button.type = 'button'
  button.id = blockInsertOptionDomId(pickerId, option.id)
  button.className = 'nano-block-insert-option'
  button.contentEditable = 'false'
  button.dataset.blockId = id
  button.dataset.optionId = option.id
  button.dataset.label = option.label
  button.dataset.md = option.markdownTrigger ?? ''
  button.dataset.selected = String(selected)
  button.dataset.action = action
  button.setAttribute('role', 'option')
  button.setAttribute('aria-selected', String(selected))
  button.tabIndex = selected ? 0 : -1
  button.title = blockOptionTitle(option)
  button.ariaLabel = blockOptionTitle(option)
  return button
}

export function blockInsertOptionDomId(pickerId: string, optionId: string): string {
  return `${pickerId}-option-${domIdPart(optionId)}`
}

export function blockOptionTitle(option: BlockOption): string {
  return option.title
}

function domIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`)
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
