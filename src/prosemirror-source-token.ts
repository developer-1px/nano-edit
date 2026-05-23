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
