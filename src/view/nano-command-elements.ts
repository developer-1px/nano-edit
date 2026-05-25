import type { NanoCommand } from '../commands/nano-command-registry'
import {
  lucideIconElement,
  type IconNode,
} from './nano-icons'

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

export function commandButton(
  command: NanoCommand,
  index: number,
  selectedIndex: number,
  optionId: string,
  runCommand: (command: NanoCommand) => void,
  selectCommand: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  const title = document.createElement('span')
  title.className = 'nano-command-title'
  title.textContent = command.title
  button.type = 'button'
  button.className = 'nano-command-option'
  button.id = optionId
  button.setAttribute('role', 'option')
  button.disabled = command.isEnabled?.() === false
  button.dataset.selected = String(index === selectedIndex)
  button.setAttribute('aria-selected', String(index === selectedIndex))
  if (button.disabled) button.setAttribute('aria-disabled', 'true')
  button.append(title)
  if (command.hint) {
    const hint = document.createElement('span')
    hint.className = 'nano-command-hint'
    hint.textContent = command.hint
    button.append(hint)
  }
  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('mousemove', selectCommand)
  button.addEventListener('click', () => runCommand(command))
  return button
}

export function commandEmptyElement(): HTMLElement {
  const empty = document.createElement('p')
  empty.className = 'nano-command-empty'
  empty.textContent = 'No command'
  return empty
}

export function commandMatches(command: NanoCommand, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true

  const searchable = [
    command.title,
    command.hint ?? '',
    ...(command.keywords ?? []),
  ].join(' ').toLowerCase()
  return terms.every((term) => searchable.includes(term))
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
