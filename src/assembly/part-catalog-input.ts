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
] as const satisfies readonly EditorPartCatalogItem[]
