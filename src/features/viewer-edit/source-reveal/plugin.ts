import {
  Plugin,
  TextSelection,
} from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { withoutProseMirrorDomObserver } from '../../../adapters/prosemirror/prosemirror-dom-observer'
import {
  sourceRevealPluginKey,
  unfocusedSourceRevealState,
  type SourceRevealPluginState,
} from './state'
import { sourceRevealDecorations } from './decorations'

export function sourceRevealPlugin(collapsedBlockIds: ReadonlySet<string>): Plugin<SourceRevealPluginState> {
  return new Plugin<SourceRevealPluginState>({
    key: sourceRevealPluginKey,
    state: {
      init: () => unfocusedSourceRevealState,
      apply: (transaction, value) => {
        const next = sourceRevealPluginStatePatchFromMeta(transaction.getMeta(sourceRevealPluginKey))
        return next ? { ...value, ...next } : value
      },
    },
    props: {
      decorations: (state) => sourceRevealDecorations(
        state,
        sourceRevealPluginKey.getState(state) ?? unfocusedSourceRevealState,
        collapsedBlockIds,
      ),
      handleDOMEvents: {
        focus: (view) => {
          view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: true }))
          return false
        },
        blur: (view) => {
          view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: false }))
          return false
        },
        mousedown: (view, event) => handleVisualSourceTokenMouseDown(view, event),
      },
    },
    view: (view) => {
      scheduleActiveSourceTokenClassSync(view)
      return {
        update: scheduleActiveSourceTokenClassSync,
        destroy: () => clearActiveSourceTokenClasses(view.dom),
      }
    },
  })
}

function sourceRevealPluginStatePatchFromMeta(meta: unknown): Partial<SourceRevealPluginState> | null {
  if (!meta || typeof meta !== 'object') return null
  const focused = Reflect.get(meta, 'focused')
  return typeof focused === 'boolean' ? { focused } : null
}

function handleVisualSourceTokenMouseDown(view: EditorView, event: MouseEvent): boolean {
  const token = visualSourceTokenElement(event.target)
  if (!token) return false

  const text = firstTextNode(token)
  if (!text) return false

  let from: number
  let to: number
  try {
    from = view.posAtDOM(text, 0)
    to = view.posAtDOM(text, text.data.length)
  } catch {
    try {
      from = view.posAtDOM(token, 0)
      to = view.posAtDOM(token, token.childNodes.length)
    } catch {
      return false
    }
  }
  if (from > to) [from, to] = [to, from]

  event.preventDefault()
  const rect = token.getBoundingClientRect()
  const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0
  const offset = Math.round(Math.max(0, Math.min(1, ratio)) * Math.max(0, to - from))
  const position = Math.max(from, Math.min(to, from + offset))
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, position)))
  view.focus()
  view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: true }))
  return true
}

function scheduleActiveSourceTokenClassSync(view: EditorView): void {
  syncActiveSourceTokenClasses(view)
  view.dom.ownerDocument.defaultView?.setTimeout(() => syncActiveSourceTokenClasses(view), 0)
}

function clearActiveSourceTokenClasses(root: ParentNode): void {
  for (const token of root.querySelectorAll('.nano-source-token-active')) {
    token.classList.remove('nano-source-token-active')
  }
}

function visualSourceTokenElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null

  const element = target.closest([
    '.nano-tag.nano-source-token',
    '.nano-note-link.nano-source-token',
    '.nano-math.nano-source-token',
    '.nano-footnote-ref.nano-source-token',
    ".nano-raw-external-link.nano-source-token[data-syntax='autolink']",
  ].join(','))
  return element instanceof HTMLElement ? element : null
}

function firstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node instanceof Text ? node : null

  for (const child of node.childNodes) {
    const text = firstTextNode(child)
    if (text) return text
  }

  return null
}

function syncActiveSourceTokenClasses(view: EditorView): void {
  withoutProseMirrorDomObserver(view, () => {
    clearActiveSourceTokenClasses(view.dom)
    for (const marker of view.dom.querySelectorAll('.nano-inline-source-replaced')) {
      const token = marker.closest('.nano-source-token')
      if (token instanceof HTMLElement) token.classList.add('nano-source-token-active')
    }
  })
}
