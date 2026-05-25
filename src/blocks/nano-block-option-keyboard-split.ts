import { Fragment, type NodeType } from 'prosemirror-model'
import { TextSelection, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../assembly/capability'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-nano'
import { nextBlockId } from './nano-block-option-keyboard-context'
import { splitContinuationContent } from './nano-block-option-split-continuation'
import { lineBreakCount } from '../core/nano-line-count'

export function splitBlockToParagraph(context: BlockKeyboardContext): Transaction | null {
  const paragraphType = context.state.schema.nodes[nanoNodeNames.paragraph]
  if (!paragraphType) return null

  return splitBlockWithTypeAndAttrs(
    context,
    paragraphType,
    { id: nextBlockId(context.state.doc, context.block.attrs.id) },
  )
}

export function splitCalloutBlock(context: BlockKeyboardContext): Transaction | null {
  const text = context.block.textContent
  const splitOffset = context.$from.parentOffset
  const split = text[splitOffset] === '\n' ? splitOffset + 1 : splitOffset
  const afterLineStart = lineBreakCount(text.slice(0, split))
  const quoteType = context.state.schema.nodes[nanoNodeNames.quote]
  if (afterLineStart <= 0 || split >= text.length || !quoteType) return splitBlockToParagraph(context)

  return splitBlockWithTypeAndAttrs(
    context,
    quoteType,
    {
      id: nextBlockId(context.state.doc, context.block.attrs.id),
      quoteMarkerDepths: context.block.attrs.calloutMarkerDepths,
      quoteMarkerSpacing: context.block.attrs.calloutMarkerSpacing,
    },
  )
}

export function splitBlockContinuingType(context: BlockKeyboardContext): Transaction {
  return splitBlockWithTypeAndAttrs(context, context.block.type, {
    ...context.block.attrs,
    id: nextBlockId(context.state.doc, context.block.attrs.id),
  })
}

export function splitBlockWithNextAttrs(
  nextAttrs: (attrs: Record<string, unknown>, id: string) => Record<string, unknown>,
): (context: BlockKeyboardContext) => Transaction {
  return (context) => splitBlockWithTypeAndAttrs(
    context,
    context.block.type,
    nextAttrs(context.block.attrs, nextBlockId(context.state.doc, context.block.attrs.id)),
  )
}

function splitBlockWithTypeAndAttrs(
  context: BlockKeyboardContext,
  afterType: NodeType,
  afterAttrs: Record<string, unknown>,
): Transaction {
  const splitOffset = context.$from.parentOffset
  const split = splitContinuationContent(context.block, splitOffset, afterAttrs)
  const before = context.block.type.create(split.beforeAttrs, context.block.content.cut(0, split.beforeTo))
  const after = afterType.create(split.afterAttrs, context.block.content.cut(split.afterFrom))
  const transaction = context.state.tr.replaceWith(
    context.blockPosition,
    context.blockPosition + context.block.nodeSize,
    Fragment.fromArray([before, after]),
  )
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + before.nodeSize + 1))
  return transaction
}
