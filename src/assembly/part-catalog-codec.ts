import type { EditorPartCatalogItem } from './part-catalog-types'

export const codecPartCatalog = [
  {
    id: 'codec.markdown-roundtrip',
    label: 'Markdown round-trip codec',
    category: 'codec',
    summary: 'Parse Markdown into NanoDocument and serialize it back without losing supported source choices.',
    surfaces: ['markdown-codec', 'document-schema'],
    pairsWith: ['codec.markdown-source-preservation'],
  },
  {
    id: 'codec.markdown-source-preservation',
    label: 'Markdown source preservation',
    category: 'codec',
    summary: 'Store marker, spacing, fence, pipe, and continuation metadata needed for stable Markdown output.',
    surfaces: ['document-schema', 'markdown-codec'],
    pairsWith: ['view.markdown-source'],
  },
  {
    id: 'codec.prosemirror-adapter',
    label: 'ProseMirror adapter',
    category: 'codec',
    summary: 'Bridge NanoDocument blocks and marks to ProseMirror nodes, marks, patches, and selections.',
    surfaces: ['prosemirror-adapter', 'document-schema', 'selection'],
    pairsWith: ['runtime.json-document', 'view.editor-host'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
