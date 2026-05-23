import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import type { BlockKeyboardContext } from './assembly/capability'

export function generatedBlockId(base: unknown, suffix: string): string {
  const id = typeof base === 'string' && base ? base : `b${Date.now().toString(36)}`
  return `${id}-${suffix}`
}

export function blockKeyboardContext(state: EditorState): BlockKeyboardContext | null {
  const { selection } = state
  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  if (!block.isTextblock) return null

  return {
    state,
    $from,
    block,
    blockPosition: $from.before(),
  }
}

export function nextBlockId(doc: ProseMirrorNode, base: unknown): string {
  const prefix = typeof base === 'string' && base ? base : `b${Date.now().toString(36)}`
  const ids = new Set<string>()
  doc.descendants((node) => {
    if (typeof node.attrs.id === 'string') ids.add(node.attrs.id)
  })

  let suffix = 2
  while (ids.has(`${prefix}-${suffix}`)) suffix += 1
  return `${prefix}-${suffix}`
}
