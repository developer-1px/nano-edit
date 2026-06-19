import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { blockId } from '../entities/block/structure/nano-block-node-kind'

let fallbackBlockIdSequence = 0

export function generatedBlockId(base: unknown, suffix: string): string {
  return `${blockIdPrefix(base)}-${suffix}`
}

export function nextBlockId(doc: ProseMirrorNode, base: unknown): string {
  return nextUnusedBlockId(usedBlockIds(doc), base)
}

export function nextUnusedBlockId(ids: ReadonlySet<string>, base: unknown): string {
  const prefix = blockIdPrefix(base)
  let suffix = 2
  while (ids.has(`${prefix}-${suffix}`)) suffix += 1
  return `${prefix}-${suffix}`
}

function usedBlockIds(doc: ProseMirrorNode): Set<string> {
  const ids = new Set<string>()
  doc.descendants((node) => {
    const id = blockId(node)
    if (id) ids.add(id)
  })
  return ids
}

function blockIdPrefix(base: unknown): string {
  if (typeof base === 'string' && base) return base

  fallbackBlockIdSequence = (fallbackBlockIdSequence + 1) % Number.MAX_SAFE_INTEGER
  return `b${Date.now().toString(36)}${fallbackBlockIdSequence.toString(36)}`
}
