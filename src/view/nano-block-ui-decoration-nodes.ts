import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { Decoration } from 'prosemirror-view'
import {
  isHeadingNode,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../blocks/nano-block-structure'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-nano'

export function decorateListNode(
  decorations: Decoration[],
  orderedListIndexes: number[],
  node: ProseMirrorNode,
  offset: number,
  collapsible: boolean,
  collapsed: boolean,
): void {
  const indent = nodeIndent(node)
  const style = [`--nano-indent: ${indent};`]
  const classes: string[] = []
  if (node.type.name === nanoNodeNames.listItem && node.attrs.kind === 'ordered') {
    orderedListIndexes[indent] = nodeOrderedStart(node) ?? ((orderedListIndexes[indent] ?? 0) + 1)
    orderedListIndexes.length = indent + 1
    style.push(`--nano-list-index: "${nodeOrderedStartText(node) ?? String(orderedListIndexes[indent])}${markdownOrderedListMarker(node.attrs.orderedMarker)}";`)
  } else {
    orderedListIndexes[indent] = 0
    orderedListIndexes.length = indent + 1
  }
  if (collapsible) classes.push('nano-list-collapsible')
  if (collapsed) classes.push('nano-list-collapsed')
  decorations.push(Decoration.node(offset, offset + node.nodeSize, {
    class: classes.join(' '),
    style: style.join(' '),
  }))
}

export function decorateHeadingNode(
  decorations: Decoration[],
  node: ProseMirrorNode,
  offset: number,
  collapsible: boolean,
  collapsed: boolean,
): void {
  if (!isHeadingNode(node)) return
  const classes: string[] = []
  if (collapsible) classes.push('nano-heading-collapsible')
  if (collapsed) classes.push('nano-heading-collapsed')
  if (classes.length > 0) decorations.push(Decoration.node(offset, offset + node.nodeSize, { class: classes.join(' ') }))
}

function markdownOrderedListMarker(marker: unknown): '.' | ')' {
  return marker === ')' ? ')' : '.'
}
