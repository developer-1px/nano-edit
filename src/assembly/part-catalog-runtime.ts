import type { EditorPartCatalogItem } from './part-catalog-types'

export const runtimePartCatalog = [
  {
    id: 'runtime.json-document',
    label: 'JSON document runtime',
    category: 'runtime',
    summary: 'Zod-validated JSON document engine with patch application and document value access.',
    surfaces: ['storage', 'document-schema'],
    pairsWith: ['runtime.history', 'runtime.selection'],
  },
  {
    id: 'runtime.history',
    label: 'History runtime',
    category: 'runtime',
    summary: 'Undo and redo support backed by document patch history.',
    surfaces: ['storage', 'command', 'keyboard'],
    pairsWith: ['input.keyboard-map'],
  },
  {
    id: 'runtime.selection',
    label: 'Selection runtime',
    category: 'runtime',
    summary: 'JSON pointer based selection snapshots bridged to editor selections.',
    surfaces: ['selection', 'storage', 'prosemirror-adapter'],
    pairsWith: ['command.block-move', 'codec.prosemirror-adapter'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
