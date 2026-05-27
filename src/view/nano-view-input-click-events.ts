import type { EditorView } from 'prosemirror-view'
import type { BlockOptionRegistry } from '../blocks/nano-block-options'
import { listFoldBlockIdFromEventTarget } from './nano-view-active-block'
import {
  blockClickActionFromEventTarget,
  blockClickTargetFromEventTarget,
} from './nano-view-block-click-target'
import type { NanoViewContext } from './nano-view-context'
import type { NanoInspectorRuntime } from './nano-view-inspector-runtime'
import type { NanoInputActions } from './nano-view-input-runtime'
import {
  externalLinkHrefFromEventTarget,
  noteReferenceTargetFromEventTarget,
  noteReferenceTransaction,
  openExternalLink,
  tagReferenceTargetFromEventTarget,
  tagReferenceTransaction,
} from './nano-view-references'

export function createNanoInputClickHandlers(
  ctxOrInspector: NanoViewContext | NanoInspectorRuntime,
  inspectorOrActions: NanoInspectorRuntime | NanoInputActions,
  actions?: NanoInputActions,
) {
  if (actions) {
    return createNanoInputClickHandlersWithRegistry(
      (ctxOrInspector as NanoViewContext).blockRegistry,
      inspectorOrActions as NanoInspectorRuntime,
      actions,
    )
  }

  return createNanoInputClickHandlersWithRegistry(
    undefined,
    ctxOrInspector as NanoInspectorRuntime,
    inspectorOrActions as NanoInputActions,
  )
}

export function createDefaultNanoInputClickHandlers(
  inspector: NanoInspectorRuntime,
  actions: NanoInputActions,
) {
  return createNanoInputClickHandlersWithRegistry(undefined, inspector, actions)
}

export function createNanoInputClickHandlersWithRegistry(
  registry: BlockOptionRegistry | undefined,
  inspector: NanoInspectorRuntime,
  actions: NanoInputActions,
) {
  const handleEditorClick = (view: EditorView, event: MouseEvent): boolean => {
    const externalHref = externalLinkHrefFromEventTarget(event.target)
    if (externalHref) return openLinkClick(view, event, externalHref)

    const handledReference = handleReferenceClick(view, event, inspector)
    if (handledReference !== null) return handledReference

    const listFoldBlockId = listFoldBlockIdFromEventTarget(event.target)
    if (listFoldBlockId) {
      event.preventDefault()
      actions.toggleCollapsedBlock(listFoldBlockId)
      view.focus()
      return true
    }

    const action = blockClickActionFromEventTarget(view.state.doc, event.target, registry)
    if (!action) return false

    const transaction = action.option.click.transaction(view.state, action.position)
    if (!transaction) return false

    event.preventDefault()
    view.dispatch(transaction.scrollIntoView())
    view.focus()
    return true
  }

  const handleEditorKeydown = (view: EditorView, event: KeyboardEvent): boolean => {
    if (event.key !== ' ' && event.key !== 'Enter') return false

    const listFoldBlockId = listFoldBlockIdFromEventTarget(event.target)
    if (listFoldBlockId) {
      event.preventDefault()
      actions.toggleCollapsedBlock(listFoldBlockId)
      view.focus()
      return true
    }

    const action = blockClickActionFromEventTarget(view.state.doc, event.target, registry)
    if (!action) return false

    const transaction = action.option.click.transaction(view.state, action.position)
    if (!transaction) return false

    event.preventDefault()
    view.dispatch(transaction.scrollIntoView())
    view.focus()
    return true
  }

  const handleEditorMouseDown = (event: MouseEvent): boolean => {
    if (
      externalLinkHrefFromEventTarget(event.target)
      || noteReferenceTargetFromEventTarget(event.target)
      || tagReferenceTargetFromEventTarget(event.target)
      || listFoldBlockIdFromEventTarget(event.target)
    ) {
      event.preventDefault()
      return true
    }

    if (!blockClickTargetFromEventTarget(event.target, registry)) return false
    event.preventDefault()
    return true
  }

  return { handleEditorClick, handleEditorKeydown, handleEditorMouseDown }
}

function openLinkClick(view: EditorView, event: MouseEvent, href: string): boolean {
  event.preventDefault()
  openExternalLink(href)
  view.focus()
  return true
}

function handleReferenceClick(
  view: EditorView,
  event: MouseEvent,
  inspector: NanoInspectorRuntime,
): boolean | null {
  const noteReferenceTarget = noteReferenceTargetFromEventTarget(event.target)
  if (noteReferenceTarget) {
    const transaction = noteReferenceTransaction(view.state, noteReferenceTarget.target, noteReferenceTarget.originBlockId)
    if (!transaction) return false

    event.preventDefault()
    inspector.dispatchAndReveal(transaction)
    view.focus()
    return true
  }

  const tagReferenceTarget = tagReferenceTargetFromEventTarget(event.target)
  if (!tagReferenceTarget) return null

  const transaction = tagReferenceTransaction(view.state, tagReferenceTarget.tag, tagReferenceTarget.originBlockId)
  if (!transaction) return false

  event.preventDefault()
  inspector.dispatchAndReveal(transaction)
  view.focus()
  return true
}
