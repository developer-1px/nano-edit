import { commandPartCatalog } from './part-catalog-command'
import { codecPartCatalog } from './part-catalog-codec'
import { indexPartCatalog } from './part-catalog-index'
import { inputPartCatalog } from './part-catalog-input'
import { runtimePartCatalog } from './part-catalog-runtime'
import type { EditorPartCatalogItem } from './part-catalog-types'
import { viewPartCatalog } from './part-catalog-view'

export const systemPartCatalog = [
  ...inputPartCatalog,
  ...commandPartCatalog,
  ...codecPartCatalog,
  ...runtimePartCatalog,
  ...viewPartCatalog,
  ...indexPartCatalog,
] as const satisfies readonly EditorPartCatalogItem[]
