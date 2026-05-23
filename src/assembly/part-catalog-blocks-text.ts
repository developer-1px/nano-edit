import type { EditorPartCatalogItem } from './part-catalog-types'

export const textBlockPartCatalog = [
  {
    id: 'block.paragraph',
    label: 'Paragraph block',
    category: 'block',
    summary: 'Plain text block with inline marks.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter'],
    pairsWith: ['mark.bold', 'mark.link', 'input.markdown-shortcuts'],
  },
  {
    id: 'block.heading',
    label: 'Heading block',
    category: 'block',
    summary: 'Level 1-6 heading with ATX and setext source metadata.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter', 'index'],
    pairsWith: ['index.outline', 'command.block-move'],
  },
  {
    id: 'block.todo',
    label: 'Todo block',
    category: 'block',
    summary: 'Task block with checked state, checkbox marker, and list indentation.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'prosemirror-adapter', 'index'],
    pairsWith: ['index.todo-filter', 'command.block-indent'],
  },
] as const satisfies readonly EditorPartCatalogItem[]
