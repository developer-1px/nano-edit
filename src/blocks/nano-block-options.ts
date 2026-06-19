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
import { blockOptionsFromCapabilities } from '../assembly/capability'
import { basicCapability } from '../capabilities/basic/capability'
import { todoCapability } from '../capabilities/todo/capability'
import { attachmentBlockOption } from './definitions/attachment'
import { bookmarkBlockOption } from './definitions/bookmark'
import { bulletListBlockOption } from './definitions/bullet-list'
import { calloutBlockOptions } from './definitions/callout'
import { codeBlockOption } from './definitions/code'
import { dividerBlockOption } from './definitions/divider'
import { imageBlockOption } from './definitions/image'
import { mathBlockOption } from './definitions/math'
import { orderedListBlockOption } from './definitions/ordered-list'
import { quoteBlockOption } from './definitions/quote'
import { referenceBlockOptions } from './definitions/reference'
import { tableBlockOption } from './definitions/table'

export interface BlockOptionRegistry {
  blockOptions: readonly BlockOption[]
  blockOptionForTemplate: (template: BlockTemplate) => BlockOption | null
  blockOptionForNode: (node: ProseMirrorNode) => BlockOption | null
  blockClickOptionForNode: (node: ProseMirrorNode) => BlockClickEntry | null
  blockBehaviorForNode: (node: ProseMirrorNode) => BlockBehavior | null
  blockAcceptsInputHints: (node: ProseMirrorNode) => boolean
  blockShortcutOptions: () => BlockShortcut[]
  blockEnterShortcutOptions: () => BlockEnterShortcut[]
  blockKeyBindingEntries: () => BlockKeyBindingEntry[]
  blockClickOptions: () => BlockClickEntry[]
  nodeTypeForBlockTemplate: (template: BlockTemplate) => NodeType | null
  blockAttrs: (template: BlockTemplate, id: unknown) => Record<string, unknown> | null
}

export const defaultBlockCapabilities: readonly EditorCapability[] = [
  basicCapability,
  todoCapability,
  {
    id: 'nano.document-blocks',
    blockOptions: [
      bulletListBlockOption,
      orderedListBlockOption,
      ...referenceBlockOptions,
      quoteBlockOption,
      ...calloutBlockOptions,
      codeBlockOption,
      mathBlockOption,
      dividerBlockOption,
      bookmarkBlockOption,
      attachmentBlockOption,
      imageBlockOption,
      tableBlockOption,
    ],
  },
]

export const blockOptions: readonly BlockOption[] = blockOptionsFromCapabilities(defaultBlockCapabilities)

const defaultBlockOptionRegistry = createBlockOptionRegistry(blockOptions)

export function createBlockOptionRegistry(
  options: readonly BlockOption[] = blockOptions,
): BlockOptionRegistry {
  const blockOptionForTemplate = (template: BlockTemplate): BlockOption | null =>
    options.find((option) => option.matchesTemplate(template)) ?? null

  const blockOptionForNode = (node: ProseMirrorNode): BlockOption | null =>
    options.find((option) => option.matches(node)) ?? null

  const blockClickOptionForNode = (node: ProseMirrorNode): BlockClickEntry | null => {
    const option = blockOptionForNode(node)
    return blockOptionHasClick(option) ? option : null
  }

  return {
    blockOptions: options,
    blockOptionForTemplate,
    blockOptionForNode,
    blockClickOptionForNode,
    blockBehaviorForNode: (node) => blockOptionForNode(node)?.behavior ?? null,
    blockAcceptsInputHints: (node) => blockOptionForNode(node)?.acceptsBlockInputHints !== false,
    blockShortcutOptions: () => options.flatMap((option) => [...(option.shortcuts ?? [])]),
    blockEnterShortcutOptions: () => options.flatMap((option) => [...(option.enterShortcuts ?? [])]),
    blockKeyBindingEntries: () => options.flatMap((option) =>
      (option.keyBindings ?? []).map((keyBinding) => ({ option, keyBinding })),
    ),
    blockClickOptions: () => options.filter(blockOptionHasClick),
    nodeTypeForBlockTemplate: (template) => blockOptionForTemplate(template)?.nodeType(template) ?? null,
    blockAttrs: (template, id) => blockOptionForTemplate(template)?.attrs(template, id) ?? null,
  }
}

function blockOptionHasClick(option: BlockOption | null): option is BlockClickEntry {
  return option?.click !== undefined
}

export function blockOptionForTemplate(template: BlockTemplate): BlockOption | null {
  return defaultBlockOptionRegistry.blockOptionForTemplate(template)
}

export function blockClickOptionForNode(node: ProseMirrorNode): BlockClickEntry | null {
  return defaultBlockOptionRegistry.blockClickOptionForNode(node)
}

export function blockBehaviorForNode(node: ProseMirrorNode): BlockBehavior | null {
  return defaultBlockOptionRegistry.blockBehaviorForNode(node)
}

export function blockAcceptsInputHints(node: ProseMirrorNode): boolean {
  return defaultBlockOptionRegistry.blockAcceptsInputHints(node)
}

export function blockShortcutOptions(): BlockShortcut[] {
  return defaultBlockOptionRegistry.blockShortcutOptions()
}

export function blockEnterShortcutOptions(): BlockEnterShortcut[] {
  return defaultBlockOptionRegistry.blockEnterShortcutOptions()
}

export function blockKeyBindingEntries(): BlockKeyBindingEntry[] {
  return defaultBlockOptionRegistry.blockKeyBindingEntries()
}

export function blockClickOptions(): BlockClickEntry[] {
  return defaultBlockOptionRegistry.blockClickOptions()
}

export function nodeTypeForBlockTemplate(template: BlockTemplate): NodeType | null {
  return defaultBlockOptionRegistry.nodeTypeForBlockTemplate(template)
}

export function blockAttrs(template: BlockTemplate, id: unknown): Record<string, unknown> | null {
  return defaultBlockOptionRegistry.blockAttrs(template, id)
}
