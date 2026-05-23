import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  nextBlockId,
  type BlockTemplate,
} from './nano-block-options'
import { todoNodeForBlockTemplate } from './capabilities/todo/view'
import {
  nanoNodeNames,
  nanoSchema,
} from './prosemirror-nano'
import {
  indentText,
  markdownBulletMarker,
  markdownIndentLevelForTemplate,
  markdownOrderedListMarker,
  nextOrderedTemplateStartAttrs,
  quoteMarkerDepths,
  quoteMarkerSpacing,
} from './nano-view-block-template-markdown'

export function continuationNodeAfterMarkdownLine(
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
        indent: markdownIndentLevelForTemplate(template.indent),
        indentText: indentText(template.indentText),
        marker: template.kind === 'bullet' ? markdownBulletMarker(template.marker) : '-',
        orderedMarker: template.kind === 'ordered' ? markdownOrderedListMarker(template.orderedMarker) : '.',
        ...(template.kind === 'ordered' ? nextOrderedTemplateStartAttrs(template) : { start: null }),
      })
    default:
      return null
  }
}
