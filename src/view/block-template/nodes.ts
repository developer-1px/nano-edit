import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import {
  blockAttrs,
  blockOptionForTemplate,
  generatedBlockId,
  nodeTypeForBlockTemplate,
  type BlockOptionRegistry,
  type BlockTemplate,
} from '../../blocks/nano-block-options'
import { nanoDocumentFromMarkdown } from '../../codecs/markdown/nano-markdown'
import {
  prosemirrorDocFromNano,
} from '../../adapters/prosemirror/prosemirror-nano'
import { selectionAfterInsertedContent } from '../../core/nano-selection'
import {
  templateText,
  markdownLineForTextBlockTemplate,
} from './markdown'
import { continuationNodeAfterMarkdownLine } from './continuation'

export function insertedNodeForBlockTemplate(
  template: BlockTemplate,
  id: string,
  registry?: BlockOptionRegistry,
): Fragment | ProseMirrorNode | null {
  if (registry && !registry.blockOptionForTemplate(template)) return null

  const markdownNode = insertedMarkdownLineNodeForBlockTemplate(template, id)
  if (markdownNode) return markdownNode

  const option = registry ? registry.blockOptionForTemplate(template) : blockOptionForTemplate(template)
  if (option?.insertedNode) return option.insertedNode(template, id)
  const type = registry ? registry.nodeTypeForBlockTemplate(template) : nodeTypeForBlockTemplate(template)
  const attrs = registry ? registry.blockAttrs(template, id) : blockAttrs(template, id)
  return type && attrs ? type.create(attrs) : null
}

export function insertedMarkdownLineNodeForBlockTemplate(template: BlockTemplate, id: string): ProseMirrorNode | null {
  const markdown = markdownLineForTextBlockTemplate(template)
  if (markdown === null) return null

  const node = prosemirrorDocFromNano(nanoDocumentFromMarkdown(markdown)).firstChild
  if (!node) return null

  return node.type.create({ ...node.attrs, id }, node.content, node.marks)
}

export function replacementNodeForBlockTemplate(
  template: BlockTemplate,
  source: ProseMirrorNode,
  registry?: BlockOptionRegistry,
): Fragment | ProseMirrorNode | null {
  if (registry && !registry.blockOptionForTemplate(template)) return null

  const option = registry ? registry.blockOptionForTemplate(template) : blockOptionForTemplate(template)
  if (option?.replacementNode) return option.replacementNode(template, source)

  const id = typeof source.attrs.id === 'string' && source.attrs.id ? source.attrs.id : generatedBlockId('b', 'changed')
  const type = registry ? registry.nodeTypeForBlockTemplate(template) : nodeTypeForBlockTemplate(template)
  const attrs = registry ? registry.blockAttrs(template, id) : blockAttrs(template, id)
  if (!type || !attrs) return null

  const content = option?.replacementContent
    ? option.replacementContent(source)
    : source.isTextblock ? source.content : null
  return type.create(attrs, content)
}

export function insertedContentForShortcutTemplate(
  doc: ProseMirrorNode,
  template: BlockTemplate,
  id: string,
  registry?: BlockOptionRegistry,
): Fragment | ProseMirrorNode | null {
  const text = templateText(template)
  if (text === null) return insertedNodeForBlockTemplate(template, id, registry)

  const node = insertedMarkdownLineNodeForBlockTemplate(template, id)
  if (!node) return null

  const continuation = text.length > 0 ? continuationNodeAfterMarkdownLine(doc, template, id) : null
  return continuation ? Fragment.fromArray([node, continuation]) : node
}

export function selectionAfterMarkdownLineEnter(
  doc: ProseMirrorNode,
  from: number,
  content: Fragment | ProseMirrorNode,
): Selection {
  if (content instanceof Fragment && content.childCount > 1) {
    const first = content.child(0)
    const next = content.child(1)
    const nextFrom = from + first.nodeSize
    return next.isTextblock
      ? TextSelection.create(doc, nextFrom + 1)
      : NodeSelection.create(doc, nextFrom)
  }

  if (!(content instanceof Fragment) && content.isTextblock) {
    return TextSelection.create(doc, from + content.nodeSize - 1)
  }

  return selectionAfterInsertedContent(doc, from, content)
}
