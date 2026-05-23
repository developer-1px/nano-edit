import type { EditorPartCatalogItem } from './part-catalog-types'

export const viewPartCatalog = [
  {
    id: 'view.editor-host',
    label: 'Editor host view',
    category: 'view',
    summary: 'Mountable host that wires engine state, ProseMirror view, command palette, and inspectors.',
    surfaces: ['view', 'prosemirror-adapter'],
    pairsWith: ['codec.prosemirror-adapter', 'runtime.json-document'],
  },
  {
    id: 'view.markdown-source',
    label: 'Markdown source view',
    category: 'view',
    summary: 'Inspector and inline source editing surface for Markdown-visible document state.',
    surfaces: ['view', 'markdown-codec'],
    pairsWith: ['codec.markdown-source-preservation', 'command.copy-markdown'],
  },
  {
    id: 'view.command-palette',
    label: 'Command palette',
    category: 'view',
    summary: 'Minimal command surface for block, mark, history, document, and inspector actions.',
    surfaces: ['view', 'command', 'keyboard'],
    pairsWith: ['command.block-convert', 'command.block-insert', 'input.keyboard-map'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
