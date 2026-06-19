import { inlineMathTokenAt } from '../entities/math/nano-math'
import { footnoteRefAt } from '../entities/reference/nano-footnote'
import { noteLinkParts } from '../entities/reference/nano-note-link'
import { tagTokenEndingAt } from '../entities/reference/nano-tag'
import {
  externalUrlTokenAt,
  externalUrlTokenEndingAt,
} from '../entities/reference/nano-url'
import { nanoMarkNames } from '../adapters/prosemirror/prosemirror-names'
import { codeSpanShortcutMatch } from './delimited-shortcuts'
import type {
  MarkOption,
  MarkShortcutMatch,
} from './types'

export const markOptions: readonly MarkOption[] = [
  {
    id: 'bold',
    markName: nanoMarkNames.bold,
    command: { label: 'B', title: 'Bold' },
    keyBindings: ['Mod-b'],
    inputTypes: ['formatBold'],
    shortcuts: [
      { name: 'bold-asterisk', open: '**' },
      { name: 'bold-underscore', open: '__', attrs: () => ({ marker: '__' }) },
    ],
  },
  {
    id: 'italic',
    markName: nanoMarkNames.italic,
    command: { label: 'I', title: 'Italic' },
    keyBindings: ['Mod-i'],
    inputTypes: ['formatItalic'],
    shortcuts: [
      { name: 'italic-asterisk', open: '*' },
      { name: 'italic-underscore', open: '_', attrs: () => ({ marker: '_' }) },
    ],
  },
  {
    id: 'underline',
    markName: nanoMarkNames.underline,
    command: { label: 'U', title: 'Underline' },
    keyBindings: ['Mod-u'],
    inputTypes: ['formatUnderline'],
    shortcuts: [{ name: 'underline-tilde', open: '~' }],
  },
  {
    id: 'strike',
    markName: nanoMarkNames.strike,
    command: { label: 'S', title: 'Strikethrough' },
    keyBindings: ['Shift-Mod-x'],
    inputTypes: ['formatStrikeThrough'],
    shortcuts: [{ name: 'strike-tilde', open: '~~' }],
  },
  {
    id: 'highlight',
    markName: nanoMarkNames.highlight,
    command: { label: 'H', title: 'Highlight' },
    shortcuts: [{ name: 'highlight-equals', open: '==' }],
  },
  {
    id: 'code',
    markName: nanoMarkNames.code,
    command: { label: '<>', title: 'Inline Code' },
    shortcuts: [{ name: 'code-backtick', match: codeSpanShortcutMatch }],
  },
  {
    id: 'tag',
    markName: nanoMarkNames.tag,
    shortcuts: [{ name: 'bear-tag', match: bearTagShortcutMatch, preserveSyntax: true }],
  },
  {
    id: 'note_link',
    markName: nanoMarkNames.noteLink,
    shortcuts: [{ name: 'bear-note-link', match: bearNoteLinkShortcutMatch, preserveSyntax: true }],
  },
  {
    id: 'math',
    markName: nanoMarkNames.math,
    shortcuts: [{ name: 'bear-math', match: bearMathShortcutMatch, preserveSyntax: true }],
  },
  {
    id: 'footnote_ref',
    markName: nanoMarkNames.footnoteRef,
    shortcuts: [{ name: 'bear-footnote-ref', match: bearFootnoteRefShortcutMatch, preserveSyntax: true }],
  },
  {
    id: 'link',
    markName: nanoMarkNames.link,
    shortcuts: [
      { name: 'markdown-link', match: markdownLinkShortcutMatch },
      { name: 'external-autolink', match: externalAutolinkShortcutMatch, preserveSyntax: true },
      { name: 'external-bare-url', match: externalBareUrlShortcutMatch, preserveSyntax: true },
    ],
  },
]

function markdownLinkShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith(')')) return null

  const closeTo = source.length
  const linkMiddle = source.lastIndexOf('](', closeTo - 1)
  if (linkMiddle < 0) return null

  const openFrom = source.lastIndexOf('[', linkMiddle - 1)
  if (openFrom < 0) return null
  if (openFrom > 0 && source[openFrom - 1] === '!') return null

  const contentFrom = openFrom + 1
  const contentTo = linkMiddle
  const destination = markdownLinkDestination(source.slice(linkMiddle + 2, closeTo - 1))
  if (contentFrom >= contentTo) return null
  if (source.slice(contentFrom, contentTo).trim().length === 0) return null
  if (!destination) return null

  return { openFrom, contentFrom, contentTo, closeTo, attrs: destination }
}

function externalAutolinkShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith('>')) return null

  const openFrom = source.lastIndexOf('<')
  if (openFrom < 0) return null

  const token = externalUrlTokenAt(source, openFrom)
  if (!token || token.syntax !== 'autolink' || token.to !== source.length) return null

  return {
    openFrom,
    contentFrom: openFrom + 1,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { href: token.href, syntax: token.syntax },
  }
}

function externalBareUrlShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!/(?:\s|[.,;:!?])$/.test(source)) return null

  const tokenSource = source.slice(0, -1)
  const token = externalUrlTokenEndingAt(tokenSource)
  if (!token || token.syntax !== 'bare') return null

  return {
    openFrom: token.from,
    contentFrom: token.from,
    contentTo: token.to,
    closeTo: source.length,
    markFrom: token.from,
    markTo: token.to,
    attrs: { href: token.href, syntax: token.syntax },
  }
}

function markdownLinkDestination(source: string): { href: string; title?: string } | null {
  const match = /^(\S+)(?:\s+"((?:\\.|[^"\\])*)")?$/.exec(source.trim())
  if (!match) return null

  const href = match[1] ?? ''
  if (!href) return null

  const title = match[2]?.replace(/\\([\\"])/g, '$1')
  return { href, ...(title ? { title } : {}) }
}

function bearTagShortcutMatch(source: string): MarkShortcutMatch | null {
  const closed = bearClosedTagShortcutMatch(source)
  if (closed) return closed

  if (!/(?:\s|[.,;:!?()[\]{}"'])$/.test(source)) return null

  const tokenSource = source.slice(0, -1)
  const tag = tagTokenEndingAt(tokenSource)
  if (!tag) return null

  const token = tag.token
  const openFrom = tokenSource.length - token.length
  return {
    openFrom,
    contentFrom: openFrom + 1,
    contentTo: tokenSource.length,
    closeTo: source.length,
    attrs: { name: tag.name },
  }
}

function bearNoteLinkShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith(']]')) return null

  const contentTo = source.length - 2
  const openFrom = source.lastIndexOf('[[', contentTo - 1)
  if (openFrom < 0) return null

  const contentFrom = openFrom + 2
  const parts = noteLinkParts(source.slice(contentFrom, contentTo))
  if (!parts) return null

  return {
    openFrom,
    contentFrom,
    contentTo,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { ...parts },
  }
}

function bearMathShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith('$')) return null

  const openFrom = source.lastIndexOf('$', source.length - 2)
  if (openFrom < 0) return null

  const math = inlineMathTokenAt(source, openFrom)
  if (!math || math.to !== source.length) return null

  return {
    openFrom,
    contentFrom: openFrom + 1,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { formula: math.formula },
  }
}

function bearFootnoteRefShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith(']')) return null

  const openFrom = source.lastIndexOf('[^')
  if (openFrom < 0) return null

  const footnote = footnoteRefAt(source, openFrom)
  if (!footnote || footnote.to !== source.length) return null

  return {
    openFrom,
    contentFrom: openFrom + 2,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: openFrom,
    markTo: source.length,
    attrs: { name: footnote.name },
  }
}

function bearClosedTagShortcutMatch(source: string): MarkShortcutMatch | null {
  if (!source.endsWith('#')) return null

  const tag = tagTokenEndingAt(source)
  if (!tag) return null

  return {
    openFrom: tag.from,
    contentFrom: tag.from + 1,
    contentTo: source.length - 1,
    closeTo: source.length,
    markFrom: tag.from,
    markTo: source.length,
    attrs: { name: tag.name },
  }
}
