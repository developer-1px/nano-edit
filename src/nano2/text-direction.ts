import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorState, Transaction } from 'prosemirror-state'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import {
  textDirection,
  type ProseMirrorTextDirection,
} from '../adapters/prosemirror/prosemirror-text-direction'
import {
  activeBlockRange,
  topLevelBlockRanges,
} from '../entities/block/structure/nano-block-ranges'

export type Nano2TextDirection = ProseMirrorTextDirection

const directionalNodeNames = new Set<string>([
  nanoNodeNames.paragraph,
  nanoNodeNames.heading,
  nanoNodeNames.listItem,
  nanoNodeNames.quote,
  nanoNodeNames.callout,
  nanoNodeNames.todo,
])

export function nano2SetTextDirectionTransaction(
  state: EditorState,
  direction: Nano2TextDirection | null,
): Transaction | null {
  const nextDirection = textDirection(direction)
  const ranges = selectedDirectionalBlockRanges(state)
  if (ranges.length === 0) return null

  let changed = false
  const tr = state.tr
  for (const range of ranges) {
    if (textDirection(range.node.attrs.textDirection) === nextDirection) continue
    tr.setNodeMarkup(range.from, undefined, {
      ...range.node.attrs,
      textDirection: nextDirection,
    })
    changed = true
  }

  return changed
    ? tr.setMeta('inputType', nextDirection ? `nano2TextDirection:${nextDirection}` : 'nano2TextDirection:unset')
    : null
}

function selectedDirectionalBlockRanges(state: EditorState): Array<{ from: number; node: ProseMirrorNode }> {
  const { selection } = state
  if (selection.empty) {
    const active = activeBlockRange(state)
    return active && isDirectionalNode(active.node)
      ? [{ from: active.from, node: active.node }]
      : []
  }

  return topLevelBlockRanges(state.doc)
    .filter((range) => range.to > selection.from && range.from < selection.to)
    .filter((range) => isDirectionalNode(range.node))
    .map((range) => ({ from: range.from, node: range.node }))
}

function isDirectionalNode(node: ProseMirrorNode): boolean {
  return directionalNodeNames.has(node.type.name)
}
