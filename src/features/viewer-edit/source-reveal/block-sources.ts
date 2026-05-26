import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorState } from 'prosemirror-state'
import {
  blockCollapseRanges,
  headingLevel,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../../../entities/block/structure/nano-block-structure'
import {
  bulletMarker,
  calloutMarkerToken,
  calloutTone,
  codeFenceCloseToken,
  codeFenceOpenToken,
  dividerMarkdown,
  headingPrefixToken,
  orderedMarker,
  quotePrefixToken,
} from '../../../adapters/prosemirror/prosemirror-block-attrs'
import { nanoNodeNames } from '../../../adapters/prosemirror/prosemirror-nano'
import { selectionTouchesBlock } from './selection'

export interface ActiveBlockSource {
  from: number
  to: number
  node: ProseMirrorNode
  leadingMarker: string | null
  trailingMarker: string | null
}

export function activeBlockSources(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string>,
): ActiveBlockSource[] {
  const blocks: ActiveBlockSource[] = []
  const orderedListIndexes: number[] = []

  for (const range of blockCollapseRanges(state.doc, collapsedBlockIds)) {
    if (range.hidden) continue

    const leadingMarker = leadingBlockMarker(range.node, orderedListIndexes)
    const trailingMarker = trailingBlockMarker(range.node)
    if (!selectionTouchesBlock(state, range.from, range.to)) continue

    blocks.push({ from: range.from, to: range.to, node: range.node, leadingMarker, trailingMarker })
  }

  return blocks
}

function leadingBlockMarker(node: ProseMirrorNode, orderedListIndexes: number[]): string | null {
  switch (node.type.name) {
    case nanoNodeNames.heading:
      return headingPrefixToken(node.attrs.headingStyle, headingLevel(node), node.attrs.atxTextSpacing) || null
    case nanoNodeNames.quote:
      return quotePrefixToken(node.attrs.quoteMarkerSpacing, node.attrs.quoteMarkerDepths)
    case nanoNodeNames.callout:
      return calloutMarkerToken(
        calloutTone(node.attrs.tone),
        node.attrs.calloutMarkerSpacing,
        node.attrs.calloutMarkerDepths,
        node.attrs.calloutTextSpacing,
      )
    case nanoNodeNames.listItem:
      return listItemMarker(node, orderedListIndexes)
    case nanoNodeNames.todo:
      return todoMarker(node, orderedListIndexes)
    case nanoNodeNames.codeBlock:
      return codeFenceOpenToken(
        node.attrs.language,
        node.attrs.fenceMarker,
        node.attrs.fenceLength,
        node.attrs.fenceIndent,
        node.attrs.fenceInfoSpacing,
      )
    case nanoNodeNames.mathBlock:
      return '$$'
    case nanoNodeNames.divider:
      return dividerMarkdown(node.attrs.marker, node.attrs.markerLength)
    default:
      orderedListIndexes.length = 0
      return null
  }
}

function trailingBlockMarker(node: ProseMirrorNode): string | null {
  if (node.type.name === nanoNodeNames.codeBlock) {
    return codeFenceCloseToken(node.attrs.fenceMarker, node.attrs.fenceLength, node.attrs.fenceIndent)
  }
  if (node.type.name === nanoNodeNames.mathBlock) return '$$'
  return null
}

function listItemMarker(node: ProseMirrorNode, orderedListIndexes: number[]): string {
  const indent = nodeIndent(node)
  if (node.attrs.kind === 'ordered') {
    orderedListIndexes[indent] = nodeOrderedStart(node) ?? ((orderedListIndexes[indent] ?? 0) + 1)
    orderedListIndexes.length = indent + 1
    return `${nodeOrderedStartText(node) ?? String(orderedListIndexes[indent])}${orderedMarker(node.attrs.orderedMarker)} `
  }

  orderedListIndexes[indent] = 0
  orderedListIndexes.length = indent + 1
  return `${bulletMarker(node.attrs.marker)} `
}

function todoMarker(node: ProseMirrorNode, orderedListIndexes: number[]): string {
  const indent = nodeIndent(node)
  orderedListIndexes[indent] = 0
  orderedListIndexes.length = indent + 1
  const checked = node.attrs.checked === true ? checkedMarkerText(node.attrs.checkedMarker) : ' '
  return `${bulletMarker(node.attrs.marker)} [${checked}] `
}

function checkedMarkerText(marker: unknown): 'x' | 'X' {
  return marker === 'X' ? 'X' : 'x'
}
