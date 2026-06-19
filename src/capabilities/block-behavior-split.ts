import { Fragment, type Node as ProseMirrorNode, type NodeType } from 'prosemirror-model'
import { TextSelection, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../assembly/capability'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { attrsWithSlicedSourceLineAttrs } from '../entities/source/nano-source-metadata'
import { blockId } from '../entities/block/structure/nano-block-node-kind'
import {
  lineBreakCount,
  lineCount,
} from '../entities/source/nano-line-count'
import { nextBlockId } from './block-behavior-id'

export function splitBlockToParagraph(context: BlockKeyboardContext): Transaction | null {
  const paragraphType = context.state.schema.nodes[nanoNodeNames.paragraph]
  if (!paragraphType) return null

  return splitBlockWithTypeAndAttrs(
    context,
    paragraphType,
    { id: nextBlockId(context.state.doc, blockId(context.block)) },
  )
}

export function splitBlockWithNextAttrs(
  nextAttrs: (attrs: Record<string, unknown>, id: string) => Record<string, unknown>,
): (context: BlockKeyboardContext) => Transaction {
  return (context) => splitBlockWithTypeAndAttrs(
    context,
    context.block.type,
    nextAttrs(context.block.attrs, nextBlockId(context.state.doc, blockId(context.block))),
  )
}

export function splitBlockWithTypeAndAttrs(
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

function splitContinuationContent(
  block: ProseMirrorNode,
  splitOffset: number,
  afterAttrs: Record<string, unknown>,
): {
  afterAttrs: Record<string, unknown>
  afterFrom: number
  beforeAttrs: Record<string, unknown>
  beforeTo: number
} {
  const text = block.textContent
  const split = text[splitOffset] === '\n' ? splitOffset + 1 : splitOffset
  const beforeText = text.slice(0, splitOffset)
  const afterText = text.slice(split)
  const beforeLineCount = lineCount(beforeText)
  const afterLineStart = lineBreakCount(text.slice(0, split))
  const afterLineCount = lineCount(afterText)
  const continuationIndents = stringIndents(block.attrs.continuationIndents)
  const footnoteContinuationIndents = stringIndents(block.attrs.footnoteContinuationIndents)

  return {
    beforeAttrs: attrsWithFootnoteContinuationIndents(
      attrsWithSlicedSourceLineAttrs(
        attrsWithContinuationIndents(block.attrs, continuationIndents.slice(0, lineBreakCount(beforeText))),
        0,
        beforeLineCount,
      ),
      footnoteContinuationIndents.slice(0, lineBreakCount(beforeText)),
    ),
    beforeTo: splitOffset,
    afterAttrs: attrsWithFootnoteContinuationIndents(
      attrsWithSlicedSourceLineAttrs(
        attrsWithContinuationIndents(afterAttrs, continuationIndents.slice(afterLineStart)),
        afterLineStart,
        afterLineCount,
      ),
      footnoteContinuationIndents.slice(afterLineStart),
    ),
    afterFrom: split,
  }
}

function stringIndents(indents: unknown): string[] {
  return Array.isArray(indents)
    ? indents.filter((indent): indent is string => typeof indent === 'string' && /^[\t ]+$/.test(indent))
    : []
}

function attrsWithFootnoteContinuationIndents(
  attrs: Record<string, unknown>,
  footnoteContinuationIndents: string[],
): Record<string, unknown> {
  const next = { ...attrs }
  if (!('name' in next) && !('footnoteTextSpacing' in next) && !('footnoteContinuationIndents' in next)) {
    delete next.footnoteContinuationIndents
    return next
  }

  if (footnoteContinuationIndents.length > 0) {
    next.footnoteContinuationIndents = footnoteContinuationIndents
  } else {
    delete next.footnoteContinuationIndents
  }
  return next
}

function attrsWithContinuationIndents(
  attrs: Record<string, unknown>,
  continuationIndents: string[],
): Record<string, unknown> {
  const next = { ...attrs }
  if (continuationIndents.length > 0) {
    next.continuationIndents = continuationIndents
  } else {
    delete next.continuationIndents
  }
  return next
}
