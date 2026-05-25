import type { Fragment, Node as ProseMirrorNode, NodeType, ResolvedPos } from 'prosemirror-model'
import type { EditorState, Transaction } from 'prosemirror-state'
import type { UrlSyntax } from '../core/nano-url'

export type ListKind = 'bullet' | 'ordered'
export type BulletMarker = '-' | '*' | '+'
export type OrderedMarker = '.' | ')'
export type DividerMarker = '---' | '***' | '___'
export type CodeFenceMarker = '`' | '~'
export type CheckedMarker = 'x' | 'X'
export type QuoteMarkerSpacing = 'space' | 'none'
export type CalloutTone = 'note' | 'tip' | 'important' | 'warning' | 'caution'
export type BlockTemplate =
  | { type: 'paragraph' }
  | { type: 'heading'; level: number; text?: string }
  | { type: 'todo'; checked: boolean; indent?: number; indentText?: string; marker?: BulletMarker; checkedMarker?: CheckedMarker; text?: string }
  | { type: 'list_item'; kind: ListKind; indent?: number; indentText?: string; marker?: BulletMarker; orderedMarker?: OrderedMarker; orderedStartText?: string; start?: number; text?: string }
  | { type: 'footnote'; footnoteTextSpacing?: QuoteMarkerSpacing; name: string; text?: string }
  | { type: 'quote'; text?: string; quoteMarkerDepths?: number[]; quoteMarkerSpacing?: QuoteMarkerSpacing[] }
  | { type: 'callout'; tone: CalloutTone; text?: string; calloutMarkerDepths?: number[]; calloutMarkerSpacing?: QuoteMarkerSpacing[]; calloutTextSpacing?: QuoteMarkerSpacing }
  | { type: 'code'; language?: string; fenceIndent?: string; fenceInfoSpacing?: string; fenceMarker?: CodeFenceMarker; fenceLength?: number }
  | { type: 'math'; text?: string; mathStyle?: 'single' }
  | { type: 'bookmark'; href: string; label?: string; title?: string; destinationStyle?: 'angle'; syntax?: UrlSyntax | 'markdown' }
  | { type: 'note_ref'; target: string; alias?: string }
  | { type: 'tag_ref'; name: string }
  | { type: 'attachment'; src: string; label?: string; title?: string; destinationStyle?: 'angle' }
  | { type: 'image'; src: string; alt?: string; destinationStyle?: 'angle'; title?: string }
  | { type: 'table'; rows?: string[][] }
  | { type: 'divider'; marker?: DividerMarker; markerLength?: number }
export type BlockNodeContent = Fragment | ProseMirrorNode | readonly ProseMirrorNode[] | null

export interface BlockShortcut {
  name: string
  pattern: RegExp
  template: (match: RegExpExecArray) => BlockTemplate
}

export interface BlockEnterShortcut {
  name: string
  pattern: RegExp
  template: (match: RegExpExecArray) => BlockTemplate
}

export interface BlockKeyBinding {
  key: string
  action?: 'insertAfterActive'
}

export interface BlockOption {
  id: string
  label: string
  title: string
  markdownTrigger?: string
  template?: BlockTemplate
  shortcuts?: readonly BlockShortcut[]
  enterShortcuts?: readonly BlockEnterShortcut[]
  keyBindings?: readonly BlockKeyBinding[]
  click?: BlockClickAction
  matchesTemplate: (template: BlockTemplate) => boolean
  matches: (node: ProseMirrorNode) => boolean
  nodeType: (template: BlockTemplate) => NodeType
  attrs: (template: BlockTemplate, id: unknown) => Record<string, unknown>
  acceptsBlockInputHints?: boolean
  canSetTextblockMarkup?: boolean
  insertedNode?: (template: BlockTemplate, id: string) => Fragment | ProseMirrorNode | null
  replacementContent?: (source: ProseMirrorNode) => BlockNodeContent
  replacementNode?: (template: BlockTemplate, source: ProseMirrorNode) => Fragment | ProseMirrorNode | null
  behavior?: BlockBehavior
}

export interface BlockClickAction {
  target: (target: EventTarget | null) => Element | null
  transaction: (state: EditorState, position: number) => Transaction | null
}

export type BlockClickEntry = BlockOption & { click: BlockClickAction }

export interface BlockKeyBindingEntry {
  option: BlockOption
  keyBinding: BlockKeyBinding
}

export interface BlockBehavior {
  enter?: (context: BlockKeyboardContext) => Transaction | null
  backspaceAtStart?: (context: BlockKeyboardContext) => Transaction | null
}

export interface BlockKeyboardContext {
  state: EditorState
  $from: ResolvedPos
  block: ProseMirrorNode
  blockPosition: number
}

export interface EditorCapability {
  id: string
  blockOptions?: readonly BlockOption[]
}
