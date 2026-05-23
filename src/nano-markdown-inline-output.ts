import { tagTokenAt } from './nano-tag'
import type { InlineMark } from './nano-markdown-inline-mark'

export function transitionMarks(active: readonly InlineMark[], next: readonly InlineMark[]): string {
  let shared = 0
  while (active[shared] && next[shared] && active[shared].key === next[shared].key) shared += 1

  return [
    ...active.slice(shared).reverse().map((mark) => mark.close),
    ...next.slice(shared).map((mark) => mark.open),
  ].join('')
}

export function escapeMarkdownText(text: string, code = false, raw = false): string {
  if (raw) return text
  if (code) return text.replace(/`/g, '\\`')

  let markdown = ''
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!
    if (char === '#' && tagTokenAt(text, index)) {
      markdown += '\\#'
      continue
    }

    markdown += /[\\`*_~=[\]$]/.test(char) ? `\\${char}` : char
  }
  return markdown
}
