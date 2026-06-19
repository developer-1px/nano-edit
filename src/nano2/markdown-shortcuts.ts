import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'
import { NodeSelection, Plugin, TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import { nanoMarkNames, nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../adapters/prosemirror/prosemirror-schema'

interface BlockShortcut {
  attrs?: Record<string, unknown>
  nodeName: string
  replace?: boolean
}

interface DelimitedShortcut {
  close?: string
  markName: string
  open: string
}

export function nano2MarkdownShortcutPlugin(): Plugin {
  return new Plugin({
    props: {
      handleTextInput: (view, from, to, text) => {
        const transaction = nano2MarkdownShortcutTransaction(view.state, from, to, text)
        if (!transaction) return false
        view.dispatch(transaction.scrollIntoView())
        return true
      },
    },
  })
}

export function nano2MarkdownShortcutTransaction(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): Transaction | null {
  if (from !== to || text.length === 0) return null

  const normalizedText = text.replace(/\u00a0/g, ' ')
  const inserted = state.tr.insertText(normalizedText, from, to)
  const cursor = from + normalizedText.length
  const $cursor = inserted.doc.resolve(cursor)
  if (!$cursor.parent.inlineContent) return null

  return applyBlockShortcut(inserted, $cursor)
    ?? applyDelimitedShortcut(inserted, $cursor)
    ?? (text === ' ' || text.includes('\u00a0') ? inserted : null)
}

function applyBlockShortcut(transaction: Transaction, $cursor: TextSelection['$from']): Transaction | null {
  const block = $cursor.parent
  const prefix = block.textBetween(0, $cursor.parentOffset)
  if (prefix.length !== $cursor.parentOffset || block.textContent.length !== prefix.length) return null

  const shortcut = blockShortcutFromPrefix(prefix, block)
  if (!shortcut) return null

  const blockPosition = $cursor.before()
  if (shortcut.replace) {
    const nodeType = nanoSchema.nodes[shortcut.nodeName]
    if (!nodeType) return null

    const node = nodeType.create({
      id: block.attrs.id ?? null,
      ...(shortcut.attrs ?? {}),
    })
    transaction.replaceWith(blockPosition, blockPosition + block.nodeSize, node)
    transaction.setSelection(NodeSelection.create(transaction.doc, blockPosition))
    return transaction
  }

  const nodeType = nanoSchema.nodes[shortcut.nodeName]
  if (!nodeType) return null

  const contentStart = $cursor.start()
  transaction.delete(contentStart, contentStart + prefix.length)
  transaction.setNodeMarkup(blockPosition, nodeType, {
    id: block.attrs.id ?? null,
    ...(shortcut.attrs ?? {}),
  })
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

function blockShortcutFromPrefix(prefix: string, block: ProseMirrorNode): BlockShortcut | null {
  const heading = /^(#{1,6}) $/.exec(prefix)
  if (heading) {
    return {
      nodeName: nanoNodeNames.heading,
      attrs: { level: heading[1]?.length ?? 1, headingStyle: 'atx' },
    }
  }

  const bareTodo = /^\[([ xX])\] $/.exec(prefix)
  if (bareTodo) {
    return todoShortcutAttrs(bareTodo[1] ?? ' ', todoAttrsFromCurrentBlock(block))
  }

  const todo = /^([-*+]) \[([ xX])\] $/.exec(prefix)
  if (todo) {
    return todoShortcutAttrs(todo[2] ?? ' ', { marker: todo[1] ?? '-' })
  }

  const bullet = /^([-*+]) $/.exec(prefix)
  if (bullet) {
    return {
      nodeName: nanoNodeNames.listItem,
      attrs: { kind: 'bullet', indent: 0, marker: bullet[1] ?? '-' },
    }
  }

  const ordered = /^(\d+)([.)]) $/.exec(prefix)
  if (ordered) {
    const startText = ordered[1] ?? '1'
    const start = Math.max(1, Number(startText))
    return {
      nodeName: nanoNodeNames.listItem,
      attrs: {
        kind: 'ordered',
        indent: 0,
        orderedMarker: ordered[2] ?? '.',
        orderedStartText: startText === String(start) ? null : startText,
        start,
      },
    }
  }

  if (prefix === '> ') {
    return { nodeName: nanoNodeNames.quote }
  }

  const code = /^(`{3,}|~{3,})([A-Za-z0-9_-]+)? $/.exec(prefix)
  if (code) {
    const fence = code[1] ?? '```'
    return {
      nodeName: nanoNodeNames.codeBlock,
      attrs: {
        fenceLength: fence.length,
        fenceMarker: fence.startsWith('~') ? '~' : '`',
        language: code[2] ?? null,
      },
    }
  }

  const divider = /^(---|\*\*\*|___) $/.exec(prefix)
  if (divider) {
    const marker = divider[1] ?? '---'
    return {
      nodeName: nanoNodeNames.divider,
      attrs: { marker: marker[0] === '*' ? '***' : marker[0] === '_' ? '___' : '---', markerLength: marker.length },
      replace: true,
    }
  }

  return null
}

function todoShortcutAttrs(checkedMarker: string, attrs: Record<string, unknown>): BlockShortcut {
  return {
    nodeName: nanoNodeNames.todo,
    attrs: {
      checked: checkedMarker.toLowerCase() === 'x',
      checkedMarker: checkedMarker === 'X' ? 'X' : 'x',
      indent: 0,
      ...attrs,
    },
  }
}

function todoAttrsFromCurrentBlock(block: ProseMirrorNode): Record<string, unknown> {
  if (block.type.name !== nanoNodeNames.listItem || block.attrs.kind !== 'bullet') {
    return { marker: '-' }
  }

  return {
    indent: block.attrs.indent ?? 0,
    indentText: block.attrs.indentText ?? null,
    marker: block.attrs.marker ?? '-',
  }
}

function applyDelimitedShortcut(transaction: Transaction, $cursor: TextSelection['$from']): Transaction | null {
  const block = $cursor.parent
  const source = block.textBetween(0, $cursor.parentOffset, undefined, '\ufffc')

  for (const shortcut of delimitedShortcuts) {
    const match = delimitedShortcutMatch(source, shortcut)
    if (!match) continue

    const markType = nanoSchema.marks[shortcut.markName]
    if (!markType) return null

    const blockStart = $cursor.start()
    const close = shortcut.close ?? shortcut.open
    transaction.delete(blockStart + match.contentTo, blockStart + match.contentTo + close.length)
    transaction.delete(blockStart + match.openFrom, blockStart + match.openFrom + shortcut.open.length)

    const markFrom = blockStart + match.openFrom
    const markTo = markFrom + match.contentTo - match.contentFrom
    const mark: Mark = markType.create()
    transaction.addMark(markFrom, markTo, mark)
    transaction.setSelection(TextSelection.create(transaction.doc, markTo))
    transaction.setStoredMarks([])
    return transaction
  }

  return null
}

const delimitedShortcuts: readonly DelimitedShortcut[] = [
  { markName: nanoMarkNames.code, open: '`' },
  { markName: nanoMarkNames.bold, open: '**' },
  { markName: nanoMarkNames.bold, open: '__' },
  { markName: nanoMarkNames.strike, open: '~~' },
  { markName: nanoMarkNames.italic, open: '*' },
  { markName: nanoMarkNames.italic, open: '_' },
]

interface DelimitedShortcutMatch {
  contentFrom: number
  contentTo: number
  openFrom: number
}

function delimitedShortcutMatch(source: string, shortcut: DelimitedShortcut): DelimitedShortcutMatch | null {
  const close = shortcut.close ?? shortcut.open
  if (!source.endsWith(close)) return null

  const contentTo = source.length - close.length
  const openFrom = source.lastIndexOf(shortcut.open, contentTo - 1)
  if (openFrom < 0) return null

  const contentFrom = openFrom + shortcut.open.length
  const content = source.slice(contentFrom, contentTo)
  if (!content.trim()) return null

  if (shortcut.open.length === 1) {
    if (source[openFrom - 1] === shortcut.open) return null
    if (source[contentTo - 1] === shortcut.open) return null
  }

  return { contentFrom, contentTo, openFrom }
}
