import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  blockToolbarOptions,
  type BlockToolbarEntry,
  type BlockToolbarOption,
} from './nano-block-options'
import {
  lucideIconElement,
  type IconNode,
} from './nano-icons'

export function button(
  label: string,
  title: string,
  onClick: () => void,
  icon?: IconNode,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  if (icon) button.append(lucideIconElement(icon, 'nano-toolbar-icon'))
  else button.textContent = label
  button.title = title
  button.ariaLabel = title
  button.dataset.action = title.toLowerCase()
  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('click', onClick)
  return button
}

export function blockToolbarButtons(render: (option: BlockToolbarEntry) => HTMLButtonElement): HTMLButtonElement[] {
  return blockToolbarOptions().map(render)
}

export function toolbarAction(toolbar: BlockToolbarOption): string {
  return toolbar.title.toLowerCase()
}

export function blockToolbarActive(option: BlockToolbarEntry, node: ProseMirrorNode): boolean {
  return option.toolbar.active ? option.toolbar.active(node) : option.matches(node)
}
