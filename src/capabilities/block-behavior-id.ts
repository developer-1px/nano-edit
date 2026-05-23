import type { Node as ProseMirrorNode } from 'prosemirror-model'

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
