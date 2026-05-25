import { NodeSelection, type Transaction } from 'prosemirror-state'
import {
  blockPositionById,
  collapsedAncestorIdsForBlockId,
} from '../blocks/nano-block-structure'
import { activeBlockId } from './nano-view-active-block'
import type { NanoViewContext } from './nano-view-context'

export interface NanoInspectorNavigation {
  dispatchAndReveal: (transaction: Transaction) => void
  selectBlockById: (id: string) => void
}

export function createNanoInspectorNavigation(ctx: NanoViewContext): NanoInspectorNavigation {
  const dispatchAndReveal = (transaction: Transaction): void => {
    ctx.view.dispatch(transaction)

    const id = activeBlockId(ctx.view.state)
    if (id && revealCollapsedAncestors(id)) {
      ctx.view.dispatch(ctx.view.state.tr.setMeta('nano-block-collapse-reveal', id))
    }

    ctx.view.dispatch(ctx.view.state.tr.scrollIntoView())
  }

  const selectBlockById = (id: string): void => {
    const position = blockPositionById(ctx.view.state.doc, id)
    if (position === null) return

    dispatchAndReveal(
      ctx.view.state.tr.setSelection(NodeSelection.create(ctx.view.state.doc, position)),
    )
    ctx.view.focus()
  }

  const revealCollapsedAncestors = (id: string): boolean => {
    const ancestorIds = collapsedAncestorIdsForBlockId(ctx.view.state.doc, id, ctx.collapsedBlockIds)
    for (const ancestorId of ancestorIds) {
      ctx.collapsedBlockIds.delete(ancestorId)
    }
    return ancestorIds.length > 0
  }

  return { dispatchAndReveal, selectBlockById }
}
