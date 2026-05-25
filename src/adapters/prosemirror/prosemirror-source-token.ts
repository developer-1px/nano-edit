import type { DOMOutputSpec } from 'prosemirror-model'

type DomAttrs = Record<string, string>

const nanoSourceTokenClass = 'nano-source-token'

export function sourceTokenAttrs(className: string, attrs: DomAttrs = {}): DomAttrs {
  return { ...attrs, class: `${nanoSourceTokenClass} ${className}` }
}

export function hiddenSourceTokenAttrs(className: string, attrs: DomAttrs = {}): DomAttrs {
  return sourceTokenAttrs(className, {
    ...attrs,
    contenteditable: 'false',
    'aria-hidden': 'true',
  })
}

export function labelledSourceTokenDomSpec(
  tag: string,
  className: string,
  label: string,
  attrs: DomAttrs = {},
): DOMOutputSpec {
  return [
    tag,
    sourceTokenAttrs(className, {
      ...attrs,
      'data-label': label,
      'aria-label': label,
    }),
    ['span', { 'aria-hidden': 'true' }, 0],
  ]
}
