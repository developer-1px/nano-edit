import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import {
  blockAttrs,
  blockOptionForTemplate,
  nodeTypeForBlockTemplate,
  type BlockOptionRegistry,
} from '../../blocks/nano-block-options'
import type { BlockTemplate } from '../../assembly/capability'
import {
  quoteMarkerDepths,
  quoteMarkerSpacing,
} from '../../blocks/options/quote-values'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import {
  bulletMarker,
  orderedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'
import { nanoDocumentFromMarkdown } from '../../codecs/markdown/nano-markdown-parse'
import { prosemirrorDocFromNano } from '../../adapters/prosemirror/prosemirror-document'
import {
  generatedBlockId,
  nextBlockId,
} from '../../capabilities/block-behavior-id'
import {
  clampIndent,
  indentText,
} from '../../capabilities/block-indent-values'
import { todoNodeForBlockTemplate } from '../../capabilities/todo/view'
import { selectionAfterInsertedContent } from '../selection/placement'
import {
  templateText,
  markdownLineForTextBlockTemplate,
} from './markdown'
import {
  nextOrderedTemplateStartAttrs,
} from './markdown-values'

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

function insertedMarkdownLineNodeForBlockTemplate(template: BlockTemplate, id: string): ProseMirrorNode | null {
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

  const id = blockId(source) || generatedBlockId(null, 'changed')
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

function continuationNodeAfterMarkdownLine(
  doc: ProseMirrorNode,
  template: BlockTemplate,
  id: string,
): ProseMirrorNode | null {
  const nextId = nextBlockId(doc, id)
  switch (template.type) {
    case 'heading':
    case 'callout':
    case 'footnote':
      return nanoSchema.nodes[nanoNodeNames.paragraph].create({ id: nextId })
    case 'quote':
      return nanoSchema.nodes[nanoNodeNames.quote].create({
        id: nextId,
        quoteMarkerSpacing: template.type === 'quote' ? quoteMarkerSpacing(template.quoteMarkerSpacing) : null,
        quoteMarkerDepths: template.type === 'quote' ? quoteMarkerDepths(template.quoteMarkerDepths) : null,
      })
    case 'todo':
      return todoNodeForBlockTemplate(template, nextId, nanoSchema.nodes[nanoNodeNames.todo])
    case 'list_item':
      return nanoSchema.nodes[nanoNodeNames.listItem].create({
        id: nextId,
        kind: template.kind,
        indent: clampIndent(template.indent),
        indentText: indentText(template.indentText),
        marker: template.kind === 'bullet' ? bulletMarker(template.marker) : '-',
        orderedMarker: template.kind === 'ordered' ? orderedMarker(template.orderedMarker) : '.',
        ...(template.kind === 'ordered' ? nextOrderedTemplateStartAttrs(template) : { start: null }),
      })
    default:
      return null
  }
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
