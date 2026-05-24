import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'
import {
  EditorState,
  Plugin,
  PluginKey,
  TextSelection,
} from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { Decoration, DecorationSet } from 'prosemirror-view'
import {
  blockCollapseRanges,
  headingLevel,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from './nano-block-structure'
import { footnoteLabel } from './nano-footnote'
import {
  boldMarker,
  codeBacktickToken,
  italicMarker,
} from './nano-markdown-inline-utils'
import { tagLabel } from './nano-tag'
import {
  bulletMarker,
  codeFenceCloseToken,
  codeFenceOpenToken,
  dividerMarkdown,
  headingPrefixToken,
  orderedMarker,
  quotePrefixToken,
  calloutMarkerToken,
  calloutTone,
} from './prosemirror-block-attrs'
import {
  linkSyntax,
  markdownLinkClose,
} from './prosemirror-link-dom'
import {
  nanoMarkNames,
  nanoNodeNames,
} from './prosemirror-nano'
import { noteLinkTitle } from './prosemirror-note-tag-dom'

export interface SourceRevealPluginState {
  focused: boolean
}

interface ActiveBlockSource {
  from: number
  to: number
  node: ProseMirrorNode
  leadingMarker: string | null
  trailingMarker: string | null
}

interface InlineMarkRange {
  mark: Mark
  from: number
  to: number
}

type InlineMarkSource =
  | { kind: 'boundary'; open: string; close: string; priority: number }
  | { kind: 'replacement'; source: string; priority: number }

const unfocusedSourceRevealState: SourceRevealPluginState = { focused: false }

export const sourceRevealPluginKey = new PluginKey<SourceRevealPluginState>('nano-source-reveal')

export function sourceRevealPlugin(collapsedBlockIds: ReadonlySet<string>): Plugin<SourceRevealPluginState> {
  return new Plugin<SourceRevealPluginState>({
    key: sourceRevealPluginKey,
    state: {
      init: () => unfocusedSourceRevealState,
      apply: (transaction, value) => {
        const next = transaction.getMeta(sourceRevealPluginKey) as Partial<SourceRevealPluginState> | undefined
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

export function sourceRevealDecorations(
  state: EditorState,
  pluginState: SourceRevealPluginState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): DecorationSet {
  if (!pluginState.focused) return DecorationSet.empty

  const decorations: Decoration[] = []
  for (const block of activeBlockSources(state, collapsedBlockIds)) {
    decorateBlockSourceMarker(decorations, block)
    decorateInlineMarkSources(decorations, state, block)
  }

  return decorations.length > 0 ? DecorationSet.create(state.doc, decorations) : DecorationSet.empty
}

function activeBlockSources(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string>,
): ActiveBlockSource[] {
  const blocks: ActiveBlockSource[] = []
  const orderedListIndexes: number[] = []

  for (const range of blockCollapseRanges(state.doc, collapsedBlockIds)) {
    if (range.hidden) continue

    const leadingMarker = leadingBlockMarker(range.node, orderedListIndexes)
    const trailingMarker = trailingBlockMarker(range.node)
    if (!selectionTouchesBlock(state, range.from, range.to)) continue

    blocks.push({ from: range.from, to: range.to, node: range.node, leadingMarker, trailingMarker })
  }

  return blocks
}

function decorateBlockSourceMarker(decorations: Decoration[], block: ActiveBlockSource): void {
  if (block.leadingMarker) {
    decorations.push(sourceWidgetDecoration(
      block.from + 1,
      block.leadingMarker,
      'nano-block-source-marker',
      'block-leading',
      `block-leading:${block.from}:${block.leadingMarker}`,
      -1000,
    ))
  }

  if (block.trailingMarker) {
    decorations.push(sourceWidgetDecoration(
      block.to - 1,
      block.trailingMarker,
      'nano-block-source-tail-marker',
      'block-trailing',
      `block-trailing:${block.to}:${block.trailingMarker}`,
      1000,
    ))
  }
}

function decorateInlineMarkSources(
  decorations: Decoration[],
  state: EditorState,
  block: ActiveBlockSource,
): void {
  if (!block.node.isTextblock) return

  const contentFrom = block.from + 1
  const ranges = collectInlineMarkRanges(block.node)
  for (const range of ranges) {
    if (!selectionTouchesInlineRange(state, contentFrom, range.from, range.to)) continue

    const text = block.node.textBetween(range.from, range.to, '', '')
    const source = inlineSourceForMark(range.mark, text)
    if (!source) continue

    const from = contentFrom + range.from
    const to = contentFrom + range.to
    if (source.kind === 'replacement') {
      decorations.push(Decoration.inline(
        from,
        to,
        { class: 'nano-inline-source-replaced' },
        {
          nanoSourceKind: 'inline-replacement-range',
          nanoSourceMark: range.mark.type.name,
          nanoSourceToken: source.source,
        },
      ))
      decorations.push(sourceWidgetDecoration(
        from,
        source.source,
        'nano-inline-source-marker nano-inline-source-replacement',
        'inline-replacement',
        `inline-replacement:${range.mark.type.name}:${from}:${to}:${source.source}`,
        -200 + source.priority,
      ))
      continue
    }

    if (source.open) {
      decorations.push(sourceWidgetDecoration(
        from,
        source.open,
        'nano-inline-source-marker',
        'inline-open',
        `inline-open:${range.mark.type.name}:${from}:${to}:${source.open}`,
        -200 + source.priority,
      ))
    }
    if (source.close) {
      decorations.push(sourceWidgetDecoration(
        to,
        source.close,
        'nano-inline-source-marker',
        'inline-close',
        `inline-close:${range.mark.type.name}:${from}:${to}:${source.close}`,
        200 - source.priority,
      ))
    }
  }
}

function sourceWidgetDecoration(
  position: number,
  token: string,
  className: string,
  kind: string,
  key: string,
  side: number,
): Decoration {
  return Decoration.widget(
    position,
    () => sourceWidget(token, className),
    {
      key,
      side,
      nanoSourceKind: kind,
      nanoSourceToken: token,
    },
  )
}

function sourceWidget(token: string, className: string): HTMLElement {
  const element = document.createElement('span')
  element.className = `nano-source-widget ${className}`
  element.setAttribute('aria-hidden', 'true')
  element.setAttribute('contenteditable', 'false')
  element.textContent = token
  return element
}

function collectInlineMarkRanges(block: ProseMirrorNode): InlineMarkRange[] {
  const segments: InlineMarkRange[] = []
  block.descendants((node, position) => {
    if (!node.isText || !node.text) return

    for (const mark of node.marks) {
      if (mark.type.name === nanoMarkNames.source) continue
      segments.push({ mark, from: position, to: position + node.text.length })
    }
  })

  segments.sort((left, right) =>
    markIdentity(left.mark).localeCompare(markIdentity(right.mark))
    || left.from - right.from
    || left.to - right.to)

  const merged: InlineMarkRange[] = []
  for (const segment of segments) {
    const previous = merged[merged.length - 1]
    if (previous && previous.mark.eq(segment.mark) && previous.to === segment.from) {
      previous.to = segment.to
      continue
    }
    merged.push({ ...segment })
  }

  return merged.sort((left, right) =>
    left.from - right.from
    || markPriority(left.mark) - markPriority(right.mark)
    || left.to - right.to)
}

function inlineSourceForMark(mark: Mark, text: string): InlineMarkSource | null {
  switch (mark.type.name) {
    case nanoMarkNames.link:
      return linkSourceForMark(mark)
    case nanoMarkNames.bold: {
      const marker = boldMarker(mark.attrs.marker)
      return { kind: 'boundary', open: marker, close: marker, priority: 20 }
    }
    case nanoMarkNames.italic: {
      const marker = italicMarker(mark.attrs.marker)
      return { kind: 'boundary', open: marker, close: marker, priority: 30 }
    }
    case nanoMarkNames.underline:
      return { kind: 'boundary', open: '~', close: '~', priority: 35 }
    case nanoMarkNames.strike:
      return { kind: 'boundary', open: '~~', close: '~~', priority: 40 }
    case nanoMarkNames.highlight:
      return { kind: 'boundary', open: '==', close: '==', priority: 45 }
    case nanoMarkNames.code: {
      const token = codeBacktickToken(mark.attrs.backtickLength, text)
      return { kind: 'boundary', open: token, close: token, priority: 50 }
    }
    case nanoMarkNames.tag:
      return replacementSource(tagLabel(String(mark.attrs.name ?? '')) ?? `#${String(mark.attrs.name ?? '')}`, 60)
    case nanoMarkNames.noteLink:
      return replacementSource(noteLinkTitle(mark.attrs.target, mark.attrs.alias), 65)
    case nanoMarkNames.math:
      return replacementSource(`$${String(mark.attrs.formula ?? '')}$`, 70)
    case nanoMarkNames.footnoteRef:
      return replacementSource(footnoteLabel(String(mark.attrs.name ?? '')) ?? `[^${String(mark.attrs.name ?? '')}]`, 75)
    default:
      return null
  }
}

function linkSourceForMark(mark: Mark): InlineMarkSource | null {
  const href = String(mark.attrs.href ?? '')
  const syntax = linkSyntax(mark.attrs.syntax)
  if (syntax === 'autolink') return replacementSource(`<${href}>`, 10)
  if (syntax === 'bare') return null

  const close = markdownLinkClose(mark.attrs.href, mark.attrs.title, mark.attrs.destinationStyle)
  if (mark.attrs.image === true) {
    return mark.attrs.imageEmptyAlt === true
      ? { kind: 'boundary', open: '!', close: close.slice(1), priority: 10 }
      : { kind: 'boundary', open: '![', close, priority: 10 }
  }

  return { kind: 'boundary', open: '[', close, priority: 10 }
}

function replacementSource(source: string, priority: number): InlineMarkSource {
  return { kind: 'replacement', source, priority }
}

function markPriority(mark: Mark): number {
  return inlineSourceForMark(mark, '')?.priority ?? 100
}

function markIdentity(mark: Mark): string {
  return `${mark.type.name}:${JSON.stringify(mark.attrs)}`
}

function selectionTouchesBlock(state: EditorState, from: number, to: number): boolean {
  if (state.selection.empty) {
    return state.selection.head >= from && state.selection.head <= to
  }

  return state.selection.ranges.some((range) => rangesIntersect(range.$from.pos, range.$to.pos, from, to))
}

function selectionTouchesInlineRange(
  state: EditorState,
  contentFrom: number,
  from: number,
  to: number,
): boolean {
  if (state.selection.empty) {
    const cursor = state.selection.head - contentFrom
    return cursor >= from && cursor <= to
  }

  return state.selection.ranges.some((range) => {
    const selectionFrom = range.$from.pos - contentFrom
    const selectionTo = range.$to.pos - contentFrom
    return rangesIntersect(selectionFrom, selectionTo, from, to)
  })
}

function rangesIntersect(leftFrom: number, leftTo: number, rightFrom: number, rightTo: number): boolean {
  return leftFrom < rightTo && leftTo > rightFrom
}

function leadingBlockMarker(node: ProseMirrorNode, orderedListIndexes: number[]): string | null {
  switch (node.type.name) {
    case nanoNodeNames.heading:
      return headingPrefixToken(node.attrs.headingStyle, headingLevel(node), node.attrs.atxTextSpacing) || null
    case nanoNodeNames.quote:
      return quotePrefixToken(node.attrs.quoteMarkerSpacing, node.attrs.quoteMarkerDepths)
    case nanoNodeNames.callout:
      return calloutMarkerToken(
        calloutTone(node.attrs.tone),
        node.attrs.calloutMarkerSpacing,
        node.attrs.calloutMarkerDepths,
        node.attrs.calloutTextSpacing,
      )
    case nanoNodeNames.listItem:
      return listItemMarker(node, orderedListIndexes)
    case nanoNodeNames.todo:
      return todoMarker(node, orderedListIndexes)
    case nanoNodeNames.codeBlock:
      return codeFenceOpenToken(
        node.attrs.language,
        node.attrs.fenceMarker,
        node.attrs.fenceLength,
        node.attrs.fenceIndent,
        node.attrs.fenceInfoSpacing,
      )
    case nanoNodeNames.mathBlock:
      return '$$'
    case nanoNodeNames.divider:
      return dividerMarkdown(node.attrs.marker, node.attrs.markerLength)
    default:
      orderedListIndexes.length = 0
      return null
  }
}

function trailingBlockMarker(node: ProseMirrorNode): string | null {
  if (node.type.name === nanoNodeNames.codeBlock) {
    return codeFenceCloseToken(node.attrs.fenceMarker, node.attrs.fenceLength, node.attrs.fenceIndent)
  }
  if (node.type.name === nanoNodeNames.mathBlock) return '$$'
  return null
}

function listItemMarker(node: ProseMirrorNode, orderedListIndexes: number[]): string {
  const indent = nodeIndent(node)
  if (node.attrs.kind === 'ordered') {
    orderedListIndexes[indent] = nodeOrderedStart(node) ?? ((orderedListIndexes[indent] ?? 0) + 1)
    orderedListIndexes.length = indent + 1
    return `${nodeOrderedStartText(node) ?? String(orderedListIndexes[indent])}${orderedMarker(node.attrs.orderedMarker)} `
  }

  orderedListIndexes[indent] = 0
  orderedListIndexes.length = indent + 1
  return `${bulletMarker(node.attrs.marker)} `
}

function todoMarker(node: ProseMirrorNode, orderedListIndexes: number[]): string {
  const indent = nodeIndent(node)
  orderedListIndexes[indent] = 0
  orderedListIndexes.length = indent + 1
  const checked = node.attrs.checked === true ? checkedMarkerText(node.attrs.checkedMarker) : ' '
  return `${bulletMarker(node.attrs.marker)} [${checked}] `
}

function checkedMarkerText(marker: unknown): 'x' | 'X' {
  return marker === 'X' ? 'X' : 'x'
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

function scheduleActiveSourceTokenClassSync(view: EditorView): void {
  syncActiveSourceTokenClasses(view)
  view.dom.ownerDocument.defaultView?.setTimeout(() => syncActiveSourceTokenClasses(view), 0)
}

function syncActiveSourceTokenClasses(view: EditorView): void {
  const observer = (view as { domObserver?: { start: () => void; stop: () => void } }).domObserver
  observer?.stop()
  try {
    clearActiveSourceTokenClasses(view.dom)
    for (const marker of view.dom.querySelectorAll('.nano-inline-source-replaced')) {
      const token = marker.closest('.nano-source-token')
      if (token instanceof HTMLElement) token.classList.add('nano-source-token-active')
    }
  } finally {
    observer?.start()
  }
}

function clearActiveSourceTokenClasses(root: ParentNode): void {
  for (const token of root.querySelectorAll('.nano-source-token-active')) {
    token.classList.remove('nano-source-token-active')
  }
}
