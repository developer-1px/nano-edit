import type { EditorPartCatalogItem } from './part-catalog-types'

export const listBlockPartCatalog = [
  {
    id: 'block.bullet-list',
    label: 'Bullet list block',
    category: 'block',
    summary: 'Unordered list item with raw marker and continuation indentation.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter'],
    pairsWith: ['command.block-indent', 'command.block-move'],
  },
  {
    id: 'block.ordered-list',
    label: 'Ordered list block',
    category: 'block',
    summary: 'Numbered list item with explicit start text and marker style.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter'],
    pairsWith: ['command.block-indent', 'command.block-move'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
