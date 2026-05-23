import type { EditorPartCatalogItem } from './part-catalog-types'

export const indexPartCatalog = [
  {
    id: 'index.outline',
    label: 'Outline index',
    category: 'index',
    summary: 'Heading index used for document outline and navigation targets.',
    surfaces: ['index'],
    pairsWith: ['block.heading', 'runtime.selection'],
  },
  {
    id: 'index.tags',
    label: 'Tag index',
    category: 'index',
    summary: 'Inline and block tag index with hierarchy-aware labels.',
    surfaces: ['index'],
    pairsWith: ['mark.tag', 'block.tag-ref'],
  },
  {
    id: 'index.backlinks',
    label: 'Backlink index',
    category: 'index',
    summary: 'Note reference and wiki link index for backlinks and missing notes.',
    surfaces: ['index'],
    pairsWith: ['mark.note-link', 'block.note-ref'],
  },
  {
    id: 'index.todo-filter',
    label: 'Todo filter index',
    category: 'index',
    summary: 'Task index supporting todo, done, and task search filters.',
    surfaces: ['index'],
    pairsWith: ['block.todo'],
  },
  {
    id: 'index.search-query',
    label: 'Search query engine',
    category: 'index',
    summary: 'Query parser and evaluator for tags, filters, exclusions, and terms.',
    surfaces: ['index', 'command'],
    pairsWith: ['index.tags', 'index.todo-filter', 'index.backlinks'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
