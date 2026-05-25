import { type Node as ProseMirrorNode, type NodeType } from 'prosemirror-model'
import type {
  BlockBehavior,
  BlockClickEntry,
  BlockTemplate,
  BlockEnterShortcut,
  BlockKeyBindingEntry,
  BlockOption,
  BlockShortcut,
  EditorCapability,
} from '../assembly/capability'
import { blockOptionsFromCapabilities } from '../assembly/registry'
import { basicCapability } from '../capabilities/basic/capability'
import { todoCapability } from '../capabilities/todo/capability'
import { remainingBlockOptions } from './nano-remaining-block-options'

export type {
  BlockBehavior,
  BlockClickAction,
  BlockClickEntry,
  BlockTemplate,
  BlockEnterShortcut,
  BlockKeyBinding,
  BlockKeyBindingEntry,
  BlockKeyboardContext,
  BlockNodeContent,
  BlockOption,
  BlockShortcut,
  BulletMarker,
  CalloutTone,
  CheckedMarker,
  CodeFenceMarker,
  DividerMarker,
  ListKind,
  OrderedMarker,
  QuoteMarkerSpacing,
} from '../assembly/capability'
export {
  blockKeyboardContext,
  generatedBlockId,
  nextBlockId,
} from './nano-block-option-internals'

const defaultBlockCapabilities = [
  basicCapability,
  todoCapability,
  { id: 'nano.remaining-blocks', blockOptions: remainingBlockOptions },
] satisfies readonly EditorCapability[]

export const blockOptions: readonly BlockOption[] = blockOptionsFromCapabilities(defaultBlockCapabilities)

export function blockOptionForTemplate(template: BlockTemplate): BlockOption | null {
  return blockOptions.find((option) => option.matchesTemplate(template)) ?? null
}

export function blockOptionForNode(node: ProseMirrorNode): BlockOption | null {
  return blockOptions.find((option) => option.matches(node)) ?? null
}

export function blockClickOptionForNode(node: ProseMirrorNode): BlockClickEntry | null {
  const option = blockOptionForNode(node)
  return option?.click ? option as BlockClickEntry : null
}

export function blockBehaviorForNode(node: ProseMirrorNode): BlockBehavior | null {
  return blockOptionForNode(node)?.behavior ?? null
}

export function blockAcceptsInputHints(node: ProseMirrorNode): boolean {
  return blockOptionForNode(node)?.acceptsBlockInputHints !== false
}

export function blockShortcutOptions(): BlockShortcut[] {
  return blockOptions.flatMap((option) => [...(option.shortcuts ?? [])])
}

export function blockEnterShortcutOptions(): BlockEnterShortcut[] {
  return blockOptions.flatMap((option) => [...(option.enterShortcuts ?? [])])
}

export function blockKeyBindingEntries(): BlockKeyBindingEntry[] {
  return blockOptions.flatMap((option) =>
    (option.keyBindings ?? []).map((keyBinding) => ({ option, keyBinding })),
  )
}

export function blockClickOptions(): BlockClickEntry[] {
  return blockOptions.filter((option): option is BlockClickEntry => option.click !== undefined)
}

export function nodeTypeForBlockTemplate(template: BlockTemplate): NodeType | null {
  return blockOptionForTemplate(template)?.nodeType(template) ?? null
}

export function blockAttrs(template: BlockTemplate, id: unknown): Record<string, unknown> | null {
  return blockOptionForTemplate(template)?.attrs(template, id) ?? null
}
