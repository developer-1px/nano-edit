export type ProseMirrorTextDirection = 'ltr' | 'rtl' | 'auto'

export function textDirection(value: unknown): ProseMirrorTextDirection | null {
  return value === 'ltr' || value === 'rtl' || value === 'auto' ? value : null
}

export function textDirectionAttrs(value: unknown): Record<string, string> {
  const direction = textDirection(value)
  return direction ? { dir: direction, 'data-text-direction': direction } : {}
}

export function textDirectionFromElement(element: HTMLElement): ProseMirrorTextDirection | null {
  return textDirection(element.dataset.textDirection) ?? textDirection(element.getAttribute('dir'))
}

export function textDirectionNodeAttrs(value: unknown): { textDirection: ProseMirrorTextDirection | null } {
  return { textDirection: textDirection(value) }
}

export function textDirectionNanoAttrs(value: unknown): { textDirection?: ProseMirrorTextDirection } {
  const direction = textDirection(value)
  return direction ? { textDirection: direction } : {}
}
