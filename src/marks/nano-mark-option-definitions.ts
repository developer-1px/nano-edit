import { nanoMarkNames } from '../adapters/prosemirror/prosemirror-nano'
import {
  bearFootnoteRefShortcutMatch,
  bearMathShortcutMatch,
  bearNoteLinkShortcutMatch,
  bearTagShortcutMatch,
  codeSpanShortcutMatch,
  externalAutolinkShortcutMatch,
  externalBareUrlShortcutMatch,
  markdownLinkShortcutMatch,
} from './nano-mark-shortcuts'
import type { MarkOption } from './nano-mark-types'

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
