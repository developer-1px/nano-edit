import { ChevronRight } from 'lucide'
import type { DOMOutputSpec } from 'prosemirror-model'
import { lucideIcon } from './nano-icons'

export function foldIndicatorDomSpec(className: 'nano-heading-fold' | 'nano-list-fold'): DOMOutputSpec {
  return [
    'span',
    {
      class: className,
      contenteditable: 'false',
      'aria-hidden': 'true',
      tabindex: '-1',
    },
    lucideIcon(ChevronRight, 'nano-fold-icon'),
  ]
}

export function syncFoldIndicatorStates(root: ParentNode): void {
  for (const indicator of root.querySelectorAll<HTMLElement>('.nano-heading-fold, .nano-list-fold')) {
    const block = indicator.closest<HTMLElement>('.nano-block')
    const collapsible = block?.classList.contains('nano-heading-collapsible') === true
      || block?.classList.contains('nano-list-collapsible') === true
    const collapsed = block?.classList.contains('nano-heading-collapsed') === true
      || block?.classList.contains('nano-list-collapsed') === true

    if (!collapsible) {
      removeAttributeIfPresent(indicator, 'role')
      setAttributeIfChanged(indicator, 'tabindex', '-1')
      setAttributeIfChanged(indicator, 'aria-hidden', 'true')
      removeAttributeIfPresent(indicator, 'aria-expanded')
      removeAttributeIfPresent(indicator, 'aria-label')
      removeAttributeIfPresent(indicator, 'title')
      continue
    }

    setAttributeIfChanged(indicator, 'role', 'button')
    setAttributeIfChanged(indicator, 'tabindex', '0')
    removeAttributeIfPresent(indicator, 'aria-hidden')
    setAttributeIfChanged(indicator, 'aria-expanded', String(!collapsed))
    setAttributeIfChanged(indicator, 'aria-label', collapsed ? 'Expand section' : 'Collapse section')
    setAttributeIfChanged(indicator, 'title', collapsed ? 'Expand section' : 'Collapse section')
  }
}

function setAttributeIfChanged(element: HTMLElement, name: string, value: string): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

function removeAttributeIfPresent(element: HTMLElement, name: string): void {
  if (element.hasAttribute(name)) element.removeAttribute(name)
}
