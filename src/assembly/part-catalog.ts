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
  | 'contenteditable-provider'
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

const textBlockPartCatalog = [
  {
    id: 'block.paragraph',
    label: 'Paragraph block',
    category: 'block',
    summary: 'Plain text block with inline marks.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider'],
    pairsWith: ['mark.bold', 'mark.link', 'input.markdown-shortcuts'],
  },
  {
    id: 'block.heading',
    label: 'Heading block',
    category: 'block',
    summary: 'Level 1-6 heading with ATX and setext source metadata.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.outline', 'command.block-move'],
  },
  {
    id: 'block.todo',
    label: 'Todo block',
    category: 'block',
    summary: 'Task block with checked state, checkbox marker, and list indentation.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.todo-filter', 'command.block-indent'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const listBlockPartCatalog = [
  {
    id: 'block.bullet-list',
    label: 'Bullet list block',
    category: 'block',
    summary: 'Unordered list item with raw marker and continuation indentation.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider'],
    pairsWith: ['command.block-indent', 'command.block-move'],
  },
  {
    id: 'block.ordered-list',
    label: 'Ordered list block',
    category: 'block',
    summary: 'Numbered list item with explicit start text and marker style.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider'],
    pairsWith: ['command.block-indent', 'command.block-move'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const richBlockPartCatalog = [
  {
    id: 'block.quote',
    label: 'Quote block',
    category: 'block',
    summary: 'Markdown quote with per-line marker spacing and nesting depth.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider'],
    pairsWith: ['input.markdown-shortcuts', 'codec.markdown-source-preservation'],
  },
  {
    id: 'block.callout',
    label: 'Callout block',
    category: 'block',
    summary: 'Markdown callout with note, tip, important, warning, and caution tones.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider'],
    pairsWith: ['block.quote', 'codec.markdown-source-preservation'],
  },
  {
    id: 'block.code',
    label: 'Code block',
    category: 'block',
    summary: 'Fenced code block preserving language, fence marker, length, and spacing.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider'],
    pairsWith: ['codec.markdown-source-preservation', 'view.markdown-source'],
  },
  {
    id: 'block.math',
    label: 'Math block',
    category: 'block',
    summary: 'Block formula with single-line and fenced Markdown forms.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['mark.math', 'index.search-query'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const atomicBlockPartCatalog = [
  {
    id: 'block.table',
    label: 'Table block',
    category: 'block',
    summary: 'Markdown table preserving alignment cells and leading or trailing pipes.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.search-query', 'codec.markdown-source-preservation'],
  },
  {
    id: 'block.image',
    label: 'Image block',
    category: 'block',
    summary: 'Source-only Markdown image with alt text, title, and explicit angle destination style.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.search-query', 'input.markdown-paste'],
  },
  {
    id: 'block.attachment',
    label: 'Attachment block',
    category: 'block',
    summary: 'Source-only file attachment link with label, title, and source destination style.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.search-query', 'mark.link'],
  },
  {
    id: 'block.bookmark',
    label: 'Bookmark block',
    category: 'block',
    summary: 'Source-only standalone URL or Markdown link promoted to a navigable bookmark block.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.search-query', 'mark.link'],
  },
  {
    id: 'block.note-ref',
    label: 'Note reference block',
    category: 'block',
    summary: 'Source-only standalone wiki link block targeting another note or heading.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['mark.note-link', 'index.backlinks'],
  },
  {
    id: 'block.tag-ref',
    label: 'Tag reference block',
    category: 'block',
    summary: 'Source-only standalone tag block that feeds the document tag index.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['mark.tag', 'index.tags'],
  },
  {
    id: 'block.footnote',
    label: 'Footnote block',
    category: 'block',
    summary: 'Footnote definition preserving tight or spaced marker text.',
    surfaces: ['document-schema', 'block-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['mark.footnote-ref', 'codec.markdown-source-preservation'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const inlinePartCatalog = [
  {
    id: 'mark.bold',
    label: 'Bold mark',
    category: 'inline',
    summary: 'Strong text mark preserving asterisk or underscore source marker.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'input-rule'],
    pairsWith: ['input.markdown-shortcuts'],
  },
  {
    id: 'mark.italic',
    label: 'Italic mark',
    category: 'inline',
    summary: 'Emphasis mark preserving asterisk or underscore source marker.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'input-rule'],
    pairsWith: ['input.markdown-shortcuts'],
  },
  {
    id: 'mark.underline',
    label: 'Underline mark',
    category: 'inline',
    summary: 'Underline mark written with single tilde Markdown delimiters.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'input-rule'],
    pairsWith: ['view.markdown-source'],
  },
  {
    id: 'mark.strike',
    label: 'Strike mark',
    category: 'inline',
    summary: 'Strikethrough mark using double tilde Markdown delimiters.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'input-rule'],
    pairsWith: ['input.markdown-shortcuts'],
  },
  {
    id: 'mark.highlight',
    label: 'Highlight mark',
    category: 'inline',
    summary: 'Inline highlight mark using double equals delimiters.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'input-rule'],
    pairsWith: ['input.markdown-shortcuts'],
  },
  {
    id: 'mark.code',
    label: 'Inline code mark',
    category: 'inline',
    summary: 'Inline code span preserving multi-backtick source length.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'input-rule'],
    pairsWith: ['codec.markdown-source-preservation'],
  },
  {
    id: 'mark.link',
    label: 'Link mark',
    category: 'inline',
    summary: 'Inline Markdown link and URL autolink preserving title and destination style.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.search-query', 'block.bookmark'],
  },
  {
    id: 'mark.tag',
    label: 'Tag mark',
    category: 'inline',
    summary: 'Inline tag with hierarchy support and multi-word tag syntax.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.tags', 'block.tag-ref'],
  },
  {
    id: 'mark.note-link',
    label: 'Note link mark',
    category: 'inline',
    summary: 'Inline wiki link with heading target and optional alias.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['index.backlinks', 'block.note-ref'],
  },
  {
    id: 'mark.math',
    label: 'Inline math mark',
    category: 'inline',
    summary: 'Inline formula mark using dollar-delimited Markdown.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['block.math', 'index.search-query'],
  },
  {
    id: 'mark.footnote-ref',
    label: 'Footnote reference mark',
    category: 'inline',
    summary: 'Inline footnote reference linked to footnote definition blocks.',
    surfaces: ['document-schema', 'mark-option', 'markdown-codec', 'contenteditable-provider', 'index'],
    pairsWith: ['block.footnote'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const inputPartCatalog = [
  {
    id: 'input.markdown-shortcuts',
    label: 'Markdown shortcuts',
    category: 'input',
    summary: 'Typed Markdown triggers that convert text into blocks or marks.',
    surfaces: ['input-rule', 'keyboard', 'command'],
    pairsWith: ['block.heading', 'block.todo', 'mark.bold'],
  },
  {
    id: 'input.markdown-paste',
    label: 'Markdown paste',
    category: 'input',
    summary: 'Clipboard Markdown paste that preserves structured block data.',
    surfaces: ['markdown-codec', 'command', 'contenteditable-provider'],
    pairsWith: ['codec.markdown-roundtrip', 'command.copy-markdown'],
  },
  {
    id: 'input.keyboard-map',
    label: 'Keyboard map',
    category: 'input',
    summary: 'Keymap layer for block movement, formatting, history, and navigation.',
    surfaces: ['keyboard', 'command'],
    pairsWith: ['runtime.history', 'command.block-move'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const commandPartCatalog = [
  {
    id: 'command.block-convert',
    label: 'Block convert command',
    category: 'command',
    summary: 'Change the active block type while preserving compatible text and source metadata.',
    surfaces: ['command', 'block-option', 'contenteditable-provider'],
    pairsWith: ['view.command-palette', 'runtime.selection'],
  },
  {
    id: 'command.block-insert',
    label: 'Block insert command',
    category: 'command',
    summary: 'Insert a command-backed block type after the active block without inventing source-only content.',
    surfaces: ['command', 'block-option', 'contenteditable-provider'],
    pairsWith: ['view.command-palette'],
  },
  {
    id: 'command.block-move',
    label: 'Block move command',
    category: 'command',
    summary: 'Move active blocks up or down, including collapsed subtrees.',
    surfaces: ['command', 'keyboard', 'contenteditable-provider'],
    pairsWith: ['runtime.selection'],
  },
  {
    id: 'command.block-indent',
    label: 'Block indent command',
    category: 'command',
    summary: 'Indent or outdent list-like blocks while shifting continuation indentation.',
    surfaces: ['command', 'keyboard', 'contenteditable-provider'],
    pairsWith: ['block.todo', 'block.bullet-list', 'block.ordered-list'],
  },
  {
    id: 'command.copy-markdown',
    label: 'Copy command',
    category: 'command',
    summary: 'Serialize the selected document range for the clipboard.',
    surfaces: ['command', 'markdown-codec', 'selection'],
    pairsWith: ['input.markdown-paste', 'codec.markdown-roundtrip'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const codecPartCatalog = [
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
] as const satisfies readonly EditorPartCatalogItem[]

const runtimePartCatalog = [
  {
    id: 'runtime.contenteditable-provider',
    label: 'Contenteditable provider',
    category: 'runtime',
    summary: 'Bridge NanoDocument blocks and marks to contenteditable provider nodes, marks, patches, and selections.',
    surfaces: ['contenteditable-provider', 'document-schema', 'selection'],
    pairsWith: ['runtime.json-document', 'view.editor-host'],
  },
  {
    id: 'runtime.json-document',
    label: 'JSON document runtime',
    category: 'runtime',
    summary: 'Schema-validated JSON document engine with patch application and document value access.',
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
    surfaces: ['selection', 'storage', 'contenteditable-provider'],
    pairsWith: ['command.block-move', 'runtime.contenteditable-provider'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const viewPartCatalog = [
  {
    id: 'view.editor-host',
    label: 'Editor host view',
    category: 'view',
    summary: 'Mountable host that wires engine state, the contenteditable provider view, command palette, and inspectors.',
    surfaces: ['view', 'contenteditable-provider'],
    pairsWith: ['runtime.contenteditable-provider', 'runtime.json-document'],
  },
  {
    id: 'view.markdown-source',
    label: 'Markdown source view',
    category: 'view',
    summary: 'Inspector and inline source editing surface for Markdown-visible document state.',
    surfaces: ['view', 'markdown-codec'],
    pairsWith: ['codec.markdown-source-preservation', 'command.copy-markdown'],
  },
  {
    id: 'view.command-palette',
    label: 'Command palette',
    category: 'view',
    summary: 'Minimal command surface for block, mark, history, document, and inspector actions.',
    surfaces: ['view', 'command', 'keyboard'],
    pairsWith: ['command.block-convert', 'command.block-insert', 'input.keyboard-map'],
  },
] as const satisfies readonly EditorPartCatalogItem[]

const indexPartCatalog = [
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

export const editorPartCatalog = [
  ...textBlockPartCatalog,
  ...listBlockPartCatalog,
  ...richBlockPartCatalog,
  ...atomicBlockPartCatalog,
  ...inlinePartCatalog,
  ...inputPartCatalog,
  ...commandPartCatalog,
  ...codecPartCatalog,
  ...runtimePartCatalog,
  ...viewPartCatalog,
  ...indexPartCatalog,
] as const satisfies readonly EditorPartCatalogItem[]

export const editorPartCatalogById: ReadonlyMap<string, EditorPartCatalogItem> = new Map(
  editorPartCatalog.map((part) => [part.id, part]),
)

export function editorPartsByCategory(category: EditorPartCategory): EditorPartCatalogItem[] {
  return editorPartCatalog.filter((part) => part.category === category)
}
