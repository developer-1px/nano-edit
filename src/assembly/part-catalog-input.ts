import type { EditorPartCatalogItem } from './part-catalog-types'

export const inputPartCatalog = [
  {
    id: 'input.markdown-shortcuts',
    label: 'Markdown shortcuts',
    category: 'input',
    summary: 'Typed Markdown triggers that convert text into blocks or marks.',
    surfaces: ['input-rule', 'keyboard', 'command'],
    pairsWith: ['block.heading', 'block.todo', 'mark.bold'],
  },
  {
    id: 'input.markdown-paste',
    label: 'Markdown paste',
    category: 'input',
    summary: 'Clipboard Markdown paste that preserves structured block data.',
    surfaces: ['markdown-codec', 'command', 'prosemirror-adapter'],
    pairsWith: ['codec.markdown-roundtrip', 'command.copy-markdown'],
  },
  {
    id: 'input.keyboard-map',
    label: 'Keyboard map',
    category: 'input',
    summary: 'Keymap layer for block movement, formatting, history, and navigation.',
    surfaces: ['keyboard', 'command'],
    pairsWith: ['runtime.history', 'command.block-move'],
  },
  {
    id: 'input.typeahead-picker',
    label: 'Typeahead picker',
    category: 'input',
    summary: 'Block picker filtering by labels, titles, and Markdown triggers.',
    surfaces: ['view', 'input-rule', 'command'],
    pairsWith: ['view.block-toolbar', 'block.paragraph'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
