import { ChevronRight } from 'lucide'
import type { DOMOutputSpec } from 'prosemirror-model'
import { lucideIcon } from './nano-icons'

export function foldIndicatorDomSpec(className: 'nano-heading-fold' | 'nano-list-fold'): DOMOutputSpec {
  return [
    'span',
    {
      class: className,
      contenteditable: 'false',
      role: 'button',
      tabindex: '0',
      'aria-label': 'Toggle section',
      title: 'Toggle section',
    },
    lucideIcon(ChevronRight, 'nano-fold-icon'),
  ]
}
