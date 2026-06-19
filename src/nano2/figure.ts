import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view'
import { z } from 'zod'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { NanoCustomBlockSchema, type NanoCustomBlock } from '../entities/block/schema/nano-block-schema'

export const nano2FigureBlockType = 'nano2.figure'

const Nano2FigureImageSchema = z.object({
  alt: z.string().optional(),
  src: z.string().min(1),
  title: z.string().optional(),
}).strict()

const Nano2FigureTableAlignSchema = z.enum(['left', 'center', 'right']).nullable()

const Nano2FigureTableSchema = z.object({
  align: z.array(Nano2FigureTableAlignSchema).optional(),
  rows: z.array(z.array(z.string()).min(2)).min(1),
}).strict().superRefine((table, context) => {
  const columnCount = table.rows[0]?.length ?? 0
  table.rows.forEach((row, rowIndex) => {
    if (row.length === columnCount) return
    context.addIssue({
      code: 'custom',
      message: `Table figure row ${rowIndex} has ${row.length} cells; expected ${columnCount}`,
      path: ['rows', rowIndex],
    })
  })
  if (table.align && table.align.length !== columnCount) {
    context.addIssue({
      code: 'custom',
      message: `Table figure align has ${table.align.length} cells; expected ${columnCount}`,
      path: ['align'],
    })
  }
})

export const Nano2FigureDataSchema = z.discriminatedUnion('kind', [
  z.object({
    caption: z.string(),
    image: Nano2FigureImageSchema,
    kind: z.literal('image'),
  }).strict(),
  z.object({
    caption: z.string(),
    kind: z.literal('table'),
    table: Nano2FigureTableSchema,
  }).strict(),
])

export const Nano2FigureBlockSchema = NanoCustomBlockSchema.extend({
  data: Nano2FigureDataSchema,
  type: z.literal(nano2FigureBlockType),
}).strict()

export type Nano2FigureBlock = z.infer<typeof Nano2FigureBlockSchema>
export type Nano2FigureData = z.infer<typeof Nano2FigureDataSchema>

const defaultFigureData: Nano2FigureData = {
  caption: 'Nano2 figure caption',
  image: {
    alt: 'Nano Edit icon',
    src: '/favicon.svg',
    title: 'Nano Edit',
  },
  kind: 'image',
}

export function nano2FigureNodeViews(): Record<string, NodeViewConstructor> {
  return {
    [nanoNodeNames.customBlock]: (node, view, getPos) => createNano2FigureNodeView(node, view, getPos),
  }
}

export function nano2FigureBlockFromCustomBlock(block: NanoCustomBlock): Nano2FigureBlock {
  const parsedData = Nano2FigureDataSchema.safeParse(block.data)
  const data = parsedData.success ? parsedData.data : defaultFigureData
  return Nano2FigureBlockSchema.parse({
    ...block,
    data,
    text: typeof block.text === 'string' ? block.text : figureText(data),
    type: nano2FigureBlockType,
  })
}

export function nano2FigureBlockWithCaption(
  block: NanoCustomBlock,
  caption: string,
): Nano2FigureBlock {
  const figure = nano2FigureBlockFromCustomBlock(block)
  const data = Nano2FigureDataSchema.parse({
    ...figure.data,
    caption,
  })
  return Nano2FigureBlockSchema.parse({
    ...figure,
    data,
    text: figureText(data),
  })
}

function createNano2FigureNodeView(
  node: ProseMirrorNode,
  view: EditorView,
  getPos: (() => number | undefined) | boolean,
): NodeView {
  if (!isFigureNode(node)) return createFallbackCustomNodeView(node)

  let currentNode = node
  let figure = figureBlockFromNode(currentNode)

  const dom = document.createElement('figure')
  dom.className = 'nano-block nano2-figure-block'
  dom.contentEditable = 'false'
  dom.dataset.id = figure.id
  dom.dataset.customBlockType = nano2FigureBlockType

  const body = document.createElement('div')
  body.className = 'nano2-figure-body'

  const caption = document.createElement('figcaption')
  caption.className = 'nano2-figure-caption'
  caption.contentEditable = 'true'
  caption.spellcheck = true
  caption.setAttribute('aria-label', 'Figure caption')

  dom.append(body, caption)

  const commitCaption = () => {
    const text = caption.textContent ?? ''
    if (text === figure.data.caption) return
    commitFigure(nano2FigureBlockWithCaption(figure, text), view, getPos)
  }
  const handleCaptionKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    caption.blur()
  }

  caption.addEventListener('input', commitCaption)
  caption.addEventListener('blur', commitCaption)
  caption.addEventListener('keydown', handleCaptionKeydown)

  render()

  return {
    dom,
    destroy() {
      caption.removeEventListener('input', commitCaption)
      caption.removeEventListener('blur', commitCaption)
      caption.removeEventListener('keydown', handleCaptionKeydown)
      dom.replaceChildren()
    },
    ignoreMutation: () => true,
    stopEvent: (event) => event.target instanceof Node && dom.contains(event.target),
    update(nextNode) {
      if (!isFigureNode(nextNode)) return false
      currentNode = nextNode
      figure = figureBlockFromNode(currentNode)
      render()
      return true
    },
  }

  function render(): void {
    const { data } = figure
    dom.dataset.kind = data.kind
    dom.dataset.caption = data.caption
    body.replaceChildren(data.kind === 'image'
      ? renderImageFigure(data)
      : renderTableFigure(data))
    if (document.activeElement !== caption && caption.textContent !== data.caption) {
      caption.textContent = data.caption
    }
  }
}

function renderImageFigure(data: Extract<Nano2FigureData, { kind: 'image' }>): HTMLElement {
  const image = document.createElement('img')
  image.className = 'nano2-figure-image'
  image.src = data.image.src
  image.alt = data.image.alt ?? ''
  if (data.image.title) image.title = data.image.title
  return image
}

function renderTableFigure(data: Extract<Nano2FigureData, { kind: 'table' }>): HTMLElement {
  const table = document.createElement('table')
  table.className = 'nano2-figure-table'
  const [headRow, ...bodyRows] = data.table.rows
  if (headRow) {
    const thead = document.createElement('thead')
    thead.append(renderTableRow(headRow, data.table.align, true))
    table.append(thead)
  }
  if (bodyRows.length) {
    const tbody = document.createElement('tbody')
    for (const row of bodyRows) tbody.append(renderTableRow(row, data.table.align, false))
    table.append(tbody)
  }
  return table
}

function renderTableRow(
  row: string[],
  align: readonly ('left' | 'center' | 'right' | null)[] | undefined,
  header: boolean,
): HTMLTableRowElement {
  const tr = document.createElement('tr')
  row.forEach((cellText, index) => {
    const cell = document.createElement(header ? 'th' : 'td')
    cell.textContent = cellText
    const cellAlign = align?.[index]
    if (cellAlign) cell.style.textAlign = cellAlign
    tr.append(cell)
  })
  return tr
}

function createFallbackCustomNodeView(node: ProseMirrorNode): NodeView {
  const dom = document.createElement('section')
  dom.className = 'nano-block nano-custom-block'
  dom.contentEditable = 'false'
  dom.dataset.id = typeof node.attrs.id === 'string' ? node.attrs.id : ''
  dom.dataset.customBlockType = typeof node.attrs.customType === 'string' ? node.attrs.customType : 'custom.block'

  const title = document.createElement('span')
  title.className = 'nano-custom-block-title'
  title.textContent = dom.dataset.customBlockType

  const text = document.createElement('span')
  text.className = 'nano-custom-block-text'
  text.textContent = typeof node.attrs.text === 'string' ? node.attrs.text : ''

  dom.append(title, text)

  return {
    dom,
    ignoreMutation: () => true,
    update: (nextNode) => {
      if (nextNode.type.name !== nanoNodeNames.customBlock) return false
      dom.dataset.id = typeof nextNode.attrs.id === 'string' ? nextNode.attrs.id : ''
      dom.dataset.customBlockType = typeof nextNode.attrs.customType === 'string' ? nextNode.attrs.customType : 'custom.block'
      title.textContent = dom.dataset.customBlockType
      text.textContent = typeof nextNode.attrs.text === 'string' ? nextNode.attrs.text : ''
      return true
    },
  }
}

function commitFigure(
  block: Nano2FigureBlock,
  view: EditorView,
  getPos: (() => number | undefined) | boolean,
): void {
  if (typeof getPos !== 'function') return

  const position = getPos()
  if (typeof position !== 'number') return

  view.dispatch(view.state.tr.setNodeMarkup(position, undefined, {
    customType: block.type,
    data: block.data,
    id: block.id,
    marks: block.marks ?? null,
    text: block.text ?? null,
  }).setMeta('inputType', 'nano2Figure:caption'))
}

function figureBlockFromNode(node: ProseMirrorNode): Nano2FigureBlock {
  return nano2FigureBlockFromCustomBlock({
    id: typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : 'nano2-figure',
    type: nano2FigureBlockType,
    ...(typeof node.attrs.text === 'string' ? { text: node.attrs.text } : {}),
    ...(Array.isArray(node.attrs.marks) ? { marks: node.attrs.marks } : {}),
    ...(isRecord(node.attrs.data) ? { data: node.attrs.data } : {}),
  })
}

function figureText(data: Nano2FigureData): string {
  return data.caption
}

function isFigureNode(node: ProseMirrorNode): boolean {
  return node.type.name === nanoNodeNames.customBlock && node.attrs.customType === nano2FigureBlockType
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
