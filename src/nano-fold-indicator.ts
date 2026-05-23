import { ChevronRight } from 'lucide'
import type { DOMOutputSpec } from 'prosemirror-model'
import { lucideIcon } from './nano-icons'

export function foldIndicatorDomSpec(className: 'nano-heading-fold' | 'nano-list-fold'): DOMOutputSpec {
  return [
    'span',
    { class: className, contenteditable: 'false', 'aria-hidden': 'true' },
    lucideIcon(ChevronRight, 'nano-fold-icon'),
  ]
}
