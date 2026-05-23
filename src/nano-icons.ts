import type { DOMOutputSpec } from 'prosemirror-model'

type IconNode = [tag: string, attrs: Record<string, string | number | undefined>][]

export function lucideIcon(icon: IconNode, className: string): DOMOutputSpec {
  return [
    'http://www.w3.org/2000/svg svg',
    {
      class: `nano-icon ${className}`,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    ...icon.map(([tag, attrs]) => [tag, attrs]),
  ]
}
