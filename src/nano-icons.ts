import type { DOMOutputSpec } from 'prosemirror-model'

export type IconNode = [tag: string, attrs: Record<string, string | number | undefined>][]

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

export function lucideIconElement(icon: IconNode, className: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', `nano-icon ${className}`)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const [tag, attrs] of icon) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag)
    for (const [name, value] of Object.entries(attrs)) {
      if (value !== undefined) child.setAttribute(name, String(value))
    }
    svg.append(child)
  }
  return svg
}
