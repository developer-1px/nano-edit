import type { EditorState } from 'prosemirror-state'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import { activeBlockRange } from '../../entities/block/structure/nano-block-ranges'

export function activeBlockId(state: EditorState): string | null {
  const block = activeBlockRange(state)
  if (!block) return null

  return blockId(block.node) || null
}
