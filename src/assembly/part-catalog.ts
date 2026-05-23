import { blockPartCatalog } from './part-catalog-blocks'
import { inlinePartCatalog } from './part-catalog-inline'
import { systemPartCatalog } from './part-catalog-system'
import type { EditorPartCatalogItem, EditorPartCategory } from './part-catalog-types'

export type {
  EditorPartCatalogItem,
  EditorPartCategory,
  EditorPartSurface,
} from './part-catalog-types'

export const editorPartCatalog = [
  ...blockPartCatalog,
  ...inlinePartCatalog,
  ...systemPartCatalog,
] as const satisfies readonly EditorPartCatalogItem[]

export const editorPartCatalogById: ReadonlyMap<string, EditorPartCatalogItem> = new Map(
  editorPartCatalog.map((part) => [part.id, part]),
)

export function editorPartsByCategory(category: EditorPartCategory): EditorPartCatalogItem[] {
  return editorPartCatalog.filter((part) => part.category === category)
}
