import type { EditorPartCatalogItem } from './part-catalog-types'

export const commandPartCatalog = [
  {
    id: 'command.block-convert',
    label: 'Block convert command',
    category: 'command',
    summary: 'Change the active block type while preserving compatible text and source metadata.',
    surfaces: ['command', 'block-option', 'prosemirror-adapter'],
    pairsWith: ['view.command-palette', 'runtime.selection'],
  },
  {
    id: 'command.block-insert',
    label: 'Block insert command',
    category: 'command',
    summary: 'Insert a command-backed block type after the active block without inventing source-only content.',
    surfaces: ['command', 'block-option', 'prosemirror-adapter'],
    pairsWith: ['view.command-palette'],
  },
  {
    id: 'command.block-move',
    label: 'Block move command',
    category: 'command',
    summary: 'Move active blocks up or down, including collapsed subtrees.',
    surfaces: ['command', 'keyboard', 'prosemirror-adapter'],
    pairsWith: ['runtime.selection'],
  },
  {
    id: 'command.block-indent',
    label: 'Block indent command',
    category: 'command',
    summary: 'Indent or outdent list-like blocks while shifting continuation indentation.',
    surfaces: ['command', 'keyboard', 'prosemirror-adapter'],
    pairsWith: ['block.todo', 'block.bullet-list', 'block.ordered-list'],
  },
  {
    id: 'command.copy-markdown',
    label: 'Copy command',
    category: 'command',
    summary: 'Serialize the selected document range for the clipboard.',
    surfaces: ['command', 'markdown-codec', 'selection'],
    pairsWith: ['input.markdown-paste', 'codec.markdown-roundtrip'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
