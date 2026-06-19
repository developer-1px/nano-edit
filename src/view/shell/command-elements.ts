import {
  lucideIconElement,
  type IconNode,
} from '../icons'

export function shellButton(label: string, title: string, icon?: IconNode): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  if (icon) button.append(lucideIconElement(icon, 'nano-shell-icon'))
  else button.textContent = label
  button.title = title
  button.ariaLabel = title
  return button
}

export function labeledSection(label: string, content: HTMLElement): HTMLElement {
  const section = document.createElement('section')
  section.ariaLabel = label
  section.append(content)
  return section
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
