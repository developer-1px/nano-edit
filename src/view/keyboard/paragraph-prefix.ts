import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import {
  markdownIndentLevel,
  markdownIndentText,
  orderedStartAttrs,
} from '../../codecs/markdown/nano-markdown-list-attrs'
import { checkedMarker } from '../../codecs/markdown/nano-markdown-marker-attrs'
import {
  calloutTone,
  quoteMarkerDepth,
} from '../../blocks/options/quote-values'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import type { BlockTemplate } from '../../assembly/capability'
import type { BlockOptionRegistry } from '../../blocks/nano-block-options'

export function paragraphPrefixInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
  registry?: BlockOptionRegistry,
): Transaction | null {
  const block = $from.parent
  if (text !== ' ' || block.type.name !== nanoNodeNames.paragraph) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset || block.textContent.length <= textBefore.length) return null

  const source = textBefore + text
  const calloutMatch = /^(>+)( ?)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\] $/i.exec(source)
  if (calloutMatch) {
    const template = {
      type: 'callout',
      tone: calloutTone(calloutMatch[3]),
    } as const satisfies BlockTemplate
    if (!blockTemplateEnabled(registry, template)) return null

    return replaceParagraphPrefix(state, $from, nanoNodeNames.callout, {
      tone: template.tone,
      calloutMarkerDepths: quoteMarkerDepthAttrs(calloutMatch[1] ?? '>'),
      calloutMarkerSpacing: [calloutMatch[2] === ' ' ? 'space' : 'none'],
      calloutTextSpacing: 'space',
    })
  }

  const quoteMatch = /^(>+) $/.exec(source)
  if (quoteMatch) {
    const template = { type: 'quote' } as const satisfies BlockTemplate
    if (!blockTemplateEnabled(registry, template)) return null

    return replaceParagraphPrefix(state, $from, nanoNodeNames.quote, {
      quoteMarkerDepths: quoteMarkerDepthAttrs(quoteMatch[1] ?? '>'),
      quoteMarkerSpacing: ['space'],
    })
  }

  const todoMatch = /^([ \t]*)([-*+]) \[([ xX])\] $/.exec(source)
  if (todoMatch) {
    const checkedMarkerValue = checkedMarker(todoMatch[3])
    const template = {
      type: 'todo',
      checked: todoMatch[3]?.toLowerCase() === 'x',
    } as const satisfies BlockTemplate
    if (!blockTemplateEnabled(registry, template)) return null

    return replaceParagraphPrefix(state, $from, nanoNodeNames.todo, {
      ...listIndentAttrs(todoMatch[1] ?? ''),
      checked: template.checked,
      marker: todoMatch[2],
      checkedMarker: checkedMarkerValue,
    })
  }

  const bulletMatch = /^([ \t]*)([-*+]) $/.exec(source)
  if (bulletMatch) {
    const template = { type: 'list_item', kind: 'bullet' } as const satisfies BlockTemplate
    if (!blockTemplateEnabled(registry, template)) return null

    return replaceParagraphPrefix(state, $from, nanoNodeNames.listItem, {
      ...listIndentAttrs(bulletMatch[1] ?? ''),
      kind: template.kind,
      marker: bulletMatch[2],
    })
  }

  const orderedMatch = /^([ \t]*)(\d+)([.)]) $/.exec(source)
  if (orderedMatch) {
    const template = { type: 'list_item', kind: 'ordered' } as const satisfies BlockTemplate
    if (!blockTemplateEnabled(registry, template)) return null

    return replaceParagraphPrefix(state, $from, nanoNodeNames.listItem, {
      ...listIndentAttrs(orderedMatch[1] ?? ''),
      kind: template.kind,
      ...orderedStartAttrs(orderedMatch[2]),
      orderedMarker: orderedMatch[3],
    })
  }

  return null
}

function blockTemplateEnabled(registry: BlockOptionRegistry | undefined, template: BlockTemplate): boolean {
  return !registry || registry.blockOptionForTemplate(template) !== null
}

function replaceParagraphPrefix(
  state: EditorState,
  $from: ResolvedPos,
  nodeName: string,
  attrs: Record<string, unknown>,
): Transaction | null {
  const type = state.schema.nodes[nodeName]
  if (!type) return null

  const block = $from.parent
  const blockPosition = $from.before()
  const node = type.create({ id: blockId(block) || null, ...attrs }, block.content.cut($from.parentOffset))
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, node)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

function listIndentAttrs(rawIndent: string): { indent: number; indentText?: string } {
  const rawIndentText = markdownIndentText(rawIndent)
  return {
    indent: markdownIndentLevel(rawIndent),
    ...(rawIndentText ? { indentText: rawIndentText } : {}),
  }
}

function quoteMarkerDepthAttrs(marker: string): number[] | null {
  const depth = quoteMarkerDepth(marker)
  return depth > 1 ? [depth] : null
}
