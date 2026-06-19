import { type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../../assembly/capability'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nextBlockId } from '../../capabilities/block-behavior-id'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import {
  splitBlockToParagraph,
  splitBlockWithNextAttrs,
  splitBlockWithTypeAndAttrs,
} from '../../capabilities/block-behavior-split'
import { lineBreakCount } from '../../entities/source/nano-line-count'

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
      id: nextBlockId(context.state.doc, blockId(context.block)),
      quoteMarkerDepths: context.block.attrs.calloutMarkerDepths,
      quoteMarkerSpacing: context.block.attrs.calloutMarkerSpacing,
    },
  )
}

export function splitBlockContinuingType(context: BlockKeyboardContext): Transaction {
  return splitBlockWithNextAttrs((attrs, id) => ({
    ...attrs,
    id,
  }))(context)
}
