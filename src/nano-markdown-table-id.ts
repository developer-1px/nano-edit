import type { MarkdownParseState } from './nano-markdown-table-types'

export function nextMarkdownBlockId(state: MarkdownParseState): string {
  const id = `md-${state.nextId}`
  state.nextId += 1
  return id
}
