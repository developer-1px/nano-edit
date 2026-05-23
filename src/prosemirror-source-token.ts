type DomAttrs = Record<string, string>

const nanoSourceTokenClass = 'nano-source-token'

export function sourceTokenAttrs(className: string, attrs: DomAttrs = {}): DomAttrs {
  return { ...attrs, class: `${nanoSourceTokenClass} ${className}` }
}
