import type { Node as ProseMirrorNode } from 'prosemirror-model'

export interface ActiveBlockRange {
  from: number
  to: number
  node: ProseMirrorNode
}

export type BlockCollapseRange = ActiveBlockRange & {
  collapsed: boolean
  collapsible: boolean
  hidden: boolean
}

export type CollapseDescriptor =
  | { type: 'heading'; id: string; level: number }
  | { type: 'list'; id: string; indent: number }
