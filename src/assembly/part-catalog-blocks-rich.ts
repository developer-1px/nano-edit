import type { EditorPartCatalogItem } from './part-catalog-types'

export const richBlockPartCatalog = [
  {
    id: 'block.quote',
    label: 'Quote block',
    category: 'block',
    summary: 'Markdown quote with per-line marker spacing and nesting depth.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter'],
    pairsWith: ['input.markdown-shortcuts', 'codec.markdown-source-preservation'],
  },
  {
    id: 'block.callout',
    label: 'Callout block',
    category: 'block',
    summary: 'Bear-style callout with note, tip, important, warning, and caution tones.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter'],
    pairsWith: ['block.quote', 'codec.markdown-source-preservation'],
  },
  {
    id: 'block.code',
    label: 'Code block',
    category: 'block',
    summary: 'Fenced code block preserving language, fence marker, length, and spacing.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter'],
    pairsWith: ['codec.markdown-source-preservation', 'view.markdown-source'],
  },
  {
    id: 'block.math',
    label: 'Math block',
    category: 'block',
    summary: 'Block formula with single-line and fenced Markdown forms.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter', 'index'],
    pairsWith: ['mark.math', 'index.search-query'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
