import type { EditorPartCatalogItem } from './part-catalog-types'

export const viewPartCatalog = [
  {
    id: 'view.editor-host',
    label: 'Editor host view',
    category: 'view',
    summary: 'Mountable host that wires engine state, ProseMirror view, toolbar, and inspectors.',
    surfaces: ['view', 'prosemirror-adapter'],
    pairsWith: ['codec.prosemirror-adapter', 'runtime.json-document'],
  },
  {
    id: 'view.block-toolbar',
    label: 'Block toolbar',
    category: 'view',
    summary: 'Toolbar surface generated from block and mark option metadata.',
    surfaces: ['view', 'block-option', 'mark-option'],
    pairsWith: ['command.block-convert', 'input.typeahead-picker'],
  },
  {
    id: 'view.markdown-source',
    label: 'Markdown source view',
    category: 'view',
    summary: 'Inspector and inline source editing surface for Markdown-visible document state.',
    surfaces: ['view', 'markdown-codec'],
    pairsWith: ['codec.markdown-source-preservation', 'command.copy-markdown'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
