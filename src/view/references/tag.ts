import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, type Transaction } from 'prosemirror-state'
import {
  activeBlockRange,
  topLevelBlockRanges,
  type ActiveBlockRange,
} from '../../blocks/nano-block-structure'
import { tagMatchesReference, tagTokensInText } from '../../core/nano-tag'
import { nanoMarkNames, nanoNodeNames } from '../../adapters/prosemirror/prosemirror-nano'
import { normalizeTagReferenceTarget } from './targets'

export function tagReferenceTransaction(
  state: EditorState,
  rawTag: string,
  originBlockId: string | null = null,
): Transaction | null {
  const tag = normalizeTagReferenceTarget(rawTag)
  if (!tag) return null

  const target = nextBlockRangeForTag(state, tag, originBlockId)
  return target ? state.tr.setSelection(NodeSelection.create(state.doc, target.from)) : null
}

function nextBlockRangeForTag(
  state: EditorState,
  rawTag: string,
  originBlockId: string | null,
): ActiveBlockRange | null {
  const target = normalizeTagReferenceTarget(rawTag).toLowerCase()
  if (!target) return null

  const ranges = topLevelBlockRanges(state.doc).filter((range) => blockHasTag(range.node, target))
  if (ranges.length === 0) return null

  const origin = tagReferenceOriginPosition(state, originBlockId)
  return ranges.find((range) => range.from > origin) ?? ranges[0] ?? null
}

function tagReferenceOriginPosition(state: EditorState, originBlockId: string | null): number {
  if (originBlockId) {
    const range = topLevelBlockRanges(state.doc).find((block) => block.node.attrs.id === originBlockId)
    if (range) return range.from
  }

  return activeBlockRange(state)?.from ?? state.selection.from
}

function blockHasTag(node: ProseMirrorNode, target: string): boolean {
  if (node.type.name === nanoNodeNames.table && tableRowsHaveTag(node.attrs.rows, target)) return true

  let found = false
  node.descendants((child) => {
    if (found || !child.isText) return false

    found = child.marks.some((mark) =>
      mark.type.name === nanoMarkNames.tag
      && tagMatchesReference(String(mark.attrs.name ?? ''), target),
    )
    return !found
  })
  return found
}

function tableRowsHaveTag(rows: unknown, target: string): boolean {
  if (!Array.isArray(rows)) return false
  return rows.some((row) =>
    Array.isArray(row)
    && row.some((cell) => rawTextHasTag(String(cell ?? ''), target)),
  )
}

function rawTextHasTag(text: string, target: string): boolean {
  for (const tag of tagTokensInText(text)) {
    if (tagMatchesReference(tag.name, target)) return true
  }
  return false
}
