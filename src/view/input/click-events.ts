import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView } from 'prosemirror-view'
import type { BlockClickEntry } from '../../assembly/capability'
import {
  blockClickOptionForNode,
  blockClickOptions,
  type BlockOptionRegistry,
} from '../../blocks/nano-block-options'
import { blockId } from '../../entities/block/structure/nano-block-node-kind'
import type { NanoViewContext } from '../runtime/context'
import type { NanoInspectorRuntime } from '../inspector/runtime'
import {
  externalLinkHrefFromEventTarget,
  openExternalLink,
} from '../references/external'
import {
  noteReferenceTransaction,
} from '../references/note'
import {
  tagReferenceTransaction,
} from '../references/tag'
import {
  noteReferenceTargetFromEventTarget,
  tagReferenceTargetFromEventTarget,
} from '../references/targets'

interface NanoInputClickActions {
  toggleCollapsedBlock: (id: string) => void
}

export function createNanoInputClickHandlers(
  ctx: NanoViewContext,
  inspector: NanoInspectorRuntime,
  actions: NanoInputClickActions,
): ReturnType<typeof createNanoInputClickHandlersWithRegistry>
export function createNanoInputClickHandlers(
  inspector: NanoInspectorRuntime,
  actions: NanoInputClickActions,
): ReturnType<typeof createNanoInputClickHandlersWithRegistry>
export function createNanoInputClickHandlers(
  ctxOrInspector: NanoViewContext | NanoInspectorRuntime,
  inspectorOrActions: NanoInspectorRuntime | NanoInputClickActions,
  actions?: NanoInputClickActions,
) {
  if (actions && hasBlockRegistry(ctxOrInspector) && isNanoInspectorRuntime(inspectorOrActions)) {
    return createNanoInputClickHandlersWithRegistry(
      ctxOrInspector.blockRegistry,
      inspectorOrActions,
      actions,
    )
  }

  if (isNanoInspectorRuntime(ctxOrInspector) && isNanoInputClickActions(inspectorOrActions)) {
    return createNanoInputClickHandlersWithRegistry(undefined, ctxOrInspector, inspectorOrActions)
  }

  throw new TypeError('Invalid Nano input click handler dependencies')
}

function hasBlockRegistry(value: NanoViewContext | NanoInspectorRuntime): value is NanoViewContext {
  return 'blockRegistry' in value
}

function isNanoInspectorRuntime(value: NanoViewContext | NanoInspectorRuntime | NanoInputClickActions): value is NanoInspectorRuntime {
  return 'dispatchAndReveal' in value
}

function isNanoInputClickActions(value: NanoInspectorRuntime | NanoInputClickActions): value is NanoInputClickActions {
  return 'toggleCollapsedBlock' in value
}

function createNanoInputClickHandlersWithRegistry(
  registry: BlockOptionRegistry | undefined,
  inspector: NanoInspectorRuntime,
  actions: NanoInputClickActions,
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

function listFoldBlockIdFromEventTarget(target: EventTarget | null): string | null {
  const element = target instanceof Element
    ? target.closest<HTMLElement>('.nano-list-fold, .nano-heading-fold')
    : null
  const block = element?.closest<HTMLElement>('.nano-block[data-id]')
  const collapsible = block?.classList.contains('nano-heading-collapsible') === true
    || block?.classList.contains('nano-list-collapsible') === true
  return collapsible ? block?.dataset.id ?? null : null
}

function blockClickActionFromEventTarget(
  doc: ProseMirrorNode,
  target: EventTarget | null,
  registry?: BlockOptionRegistry,
): { option: BlockClickEntry; position: number } | null {
  const targetElement = blockClickTargetFromEventTarget(target, registry)
  const id = targetElement?.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id
  if (!id) return null

  let action: { option: BlockClickEntry; position: number } | null = null
  doc.descendants((node, nodePosition) => {
    if (action) return false
    const option = registry
      ? registry.blockClickOptionForNode(node)
      : blockClickOptionForNode(node)
    if (option && blockId(node) === id) {
      action = { option, position: nodePosition }
      return false
    }
    return true
  })
  return action
}

function blockClickTargetFromEventTarget(
  target: EventTarget | null,
  registry?: BlockOptionRegistry,
): Element | null {
  for (const option of (registry ? registry.blockClickOptions() : blockClickOptions())) {
    const element = option.click.target(target)
    if (element) return element
  }
  return null
}
