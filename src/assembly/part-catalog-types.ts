export type EditorPartCategory =
  | 'block'
  | 'command'
  | 'codec'
  | 'index'
  | 'input'
  | 'inline'
  | 'runtime'
  | 'view'

export type EditorPartSurface =
  | 'block-option'
  | 'command'
  | 'document-schema'
  | 'index'
  | 'input-rule'
  | 'keyboard'
  | 'markdown-codec'
  | 'mark-option'
  | 'prosemirror-adapter'
  | 'selection'
  | 'storage'
  | 'view'

export interface EditorPartCatalogItem {
  id: string
  label: string
  category: EditorPartCategory
  summary: string
  surfaces: readonly EditorPartSurface[]
  pairsWith?: readonly string[]
}
