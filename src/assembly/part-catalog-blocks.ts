import { atomicBlockPartCatalog } from './part-catalog-blocks-atomic'
import { listBlockPartCatalog } from './part-catalog-blocks-list'
import { richBlockPartCatalog } from './part-catalog-blocks-rich'
import { textBlockPartCatalog } from './part-catalog-blocks-text'
import type { EditorPartCatalogItem } from './part-catalog-types'

export const blockPartCatalog = [
  ...textBlockPartCatalog,
  ...listBlockPartCatalog,
  ...richBlockPartCatalog,
  ...atomicBlockPartCatalog,
] as const satisfies readonly EditorPartCatalogItem[]
