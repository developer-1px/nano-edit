import { Brush, Undo2 } from 'lucide'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { NodeView, NodeViewConstructor, EditorView } from 'prosemirror-view'
import { z } from 'zod'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { NanoCustomBlockSchema, type NanoCustomBlock } from '../entities/block/schema/nano-block-schema'
import { lucideIconElement } from '../view/icons'

export const nano2DrawingBlockType = 'nano2.drawing'

const Nano2DrawingPointSchema = z.tuple([
  z.number().finite().min(0),
  z.number().finite().min(0),
])

const Nano2DrawingStrokeSchema = z.object({
  color: z.string().min(1),
  points: z.array(Nano2DrawingPointSchema).min(2),
  width: z.number().finite().min(1).max(24),
}).strict()

export const Nano2DrawingDataSchema = z.object({
  height: z.number().int().min(80).max(1200),
  strokes: z.array(Nano2DrawingStrokeSchema),
  width: z.number().int().min(120).max(2000),
}).strict()

export const Nano2DrawingBlockSchema = NanoCustomBlockSchema.extend({
  data: Nano2DrawingDataSchema,
  type: z.literal(nano2DrawingBlockType),
}).strict()

export type Nano2DrawingBlock = z.infer<typeof Nano2DrawingBlockSchema>
export type Nano2DrawingData = z.infer<typeof Nano2DrawingDataSchema>
export type Nano2DrawingStroke = z.infer<typeof Nano2DrawingStrokeSchema>

const defaultDrawingData: Nano2DrawingData = {
  height: 180,
  strokes: [],
  width: 480,
}

export function nano2DrawingNodeViews(): Record<string, NodeViewConstructor> {
  return {
    [nanoNodeNames.customBlock]: (node, view, getPos) => createNano2DrawingNodeView(node, view, getPos),
  }
}

export function nano2DrawingBlockWithStroke(
  block: NanoCustomBlock,
  stroke: Nano2DrawingStroke,
): Nano2DrawingBlock {
  const drawing = nano2DrawingBlockFromCustomBlock(block)
  return Nano2DrawingBlockSchema.parse({
    ...drawing,
    data: {
      ...drawing.data,
      strokes: [...drawing.data.strokes, stroke],
    },
    text: drawingText(drawing.data.strokes.length + 1),
  })
}

export function nano2DrawingBlockCleared(block: NanoCustomBlock): Nano2DrawingBlock {
  const drawing = nano2DrawingBlockFromCustomBlock(block)
  return Nano2DrawingBlockSchema.parse({
    ...drawing,
    data: {
      ...drawing.data,
      strokes: [],
    },
    text: drawingText(0),
  })
}

export function isNano2DrawingBlock(block: NanoCustomBlock): block is Nano2DrawingBlock {
  return Nano2DrawingBlockSchema.safeParse(block).success
}

function createNano2DrawingNodeView(
  node: ProseMirrorNode,
  view: EditorView,
  getPos: (() => number | undefined) | boolean,
): NodeView {
  if (!isDrawingNode(node)) return createFallbackCustomNodeView(node)

  let currentNode = node
  let drawing = drawingBlockFromNode(currentNode)
  let draftStroke: Nano2DrawingStroke | null = null

  const dom = document.createElement('section')
  dom.className = 'nano-block nano2-drawing-block'
  dom.contentEditable = 'false'
  dom.dataset.id = drawing.id
  dom.dataset.customBlockType = nano2DrawingBlockType

  const toolbar = document.createElement('div')
  toolbar.className = 'nano2-drawing-toolbar'

  const meta = document.createElement('span')
  meta.className = 'nano2-drawing-meta'

  const brushButton = drawingButton('Draw sample', Brush)
  const clearButton = drawingButton('Clear drawing', Undo2)

  const canvas = document.createElement('canvas')
  canvas.className = 'nano2-drawing-canvas'
  canvas.width = drawing.data.width
  canvas.height = drawing.data.height

  toolbar.append(meta, brushButton, clearButton)
  dom.append(toolbar, canvas)

  const startMouseStroke = (event: MouseEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    draftStroke = {
      color: '#d95b56',
      points: [canvasPoint(canvas, event)],
      width: 3,
    }
    render()
  }
  const moveMouseStroke = (event: MouseEvent) => {
    if (!draftStroke) return
    event.preventDefault()
    draftStroke = {
      ...draftStroke,
      points: [...draftStroke.points, canvasPoint(canvas, event)],
    }
    render()
  }
  const finishMouseStroke = (event: MouseEvent) => {
    if (!draftStroke) return
    event.preventDefault()
    const stroke = draftStroke.points.length > 1
      ? draftStroke
      : sampleStroke(drawing.data, drawing.data.strokes.length)
    draftStroke = null
    commitDrawing(nano2DrawingBlockWithStroke(drawing, stroke), view, getPos)
  }
  const addSampleStroke = (event: MouseEvent) => {
    event.preventDefault()
    commitDrawing(nano2DrawingBlockWithStroke(drawing, sampleStroke(drawing.data, drawing.data.strokes.length)), view, getPos)
  }
  const clearDrawing = (event: MouseEvent) => {
    event.preventDefault()
    commitDrawing(nano2DrawingBlockCleared(drawing), view, getPos)
  }

  canvas.addEventListener('mousedown', startMouseStroke)
  canvas.addEventListener('mousemove', moveMouseStroke)
  canvas.addEventListener('mouseup', finishMouseStroke)
  canvas.addEventListener('mouseleave', finishMouseStroke)
  brushButton.addEventListener('mousedown', preventMouseBlur)
  brushButton.addEventListener('click', addSampleStroke)
  clearButton.addEventListener('mousedown', preventMouseBlur)
  clearButton.addEventListener('click', clearDrawing)

  render()

  return {
    dom,
    destroy() {
      canvas.removeEventListener('mousedown', startMouseStroke)
      canvas.removeEventListener('mousemove', moveMouseStroke)
      canvas.removeEventListener('mouseup', finishMouseStroke)
      canvas.removeEventListener('mouseleave', finishMouseStroke)
      brushButton.removeEventListener('mousedown', preventMouseBlur)
      brushButton.removeEventListener('click', addSampleStroke)
      clearButton.removeEventListener('mousedown', preventMouseBlur)
      clearButton.removeEventListener('click', clearDrawing)
      dom.replaceChildren()
    },
    ignoreMutation: () => true,
    stopEvent: (event) => event.target instanceof Node && dom.contains(event.target),
    update(nextNode) {
      if (!isDrawingNode(nextNode)) return false
      currentNode = nextNode
      drawing = drawingBlockFromNode(currentNode)
      render()
      return true
    },
  }

  function render(): void {
    dom.dataset.strokes = String(drawing.data.strokes.length)
    meta.textContent = `${drawing.data.strokes.length} strokes`
    if (canvas.width !== drawing.data.width) canvas.width = drawing.data.width
    if (canvas.height !== drawing.data.height) canvas.height = drawing.data.height
    renderDrawingCanvas(canvas, drawing.data, draftStroke)
  }
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

function commitDrawing(
  block: Nano2DrawingBlock,
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
  }).setMeta('inputType', 'nano2Drawing:update'))
}

function drawingBlockFromNode(node: ProseMirrorNode): Nano2DrawingBlock {
  return nano2DrawingBlockFromCustomBlock({
    id: typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : 'nano2-drawing',
    type: nano2DrawingBlockType,
    ...(typeof node.attrs.text === 'string' ? { text: node.attrs.text } : {}),
    ...(Array.isArray(node.attrs.marks) ? { marks: node.attrs.marks } : {}),
    ...(isRecord(node.attrs.data) ? { data: node.attrs.data } : {}),
  })
}

function nano2DrawingBlockFromCustomBlock(block: NanoCustomBlock): Nano2DrawingBlock {
  const parsedData = Nano2DrawingDataSchema.safeParse(block.data)
  const data = parsedData.success ? parsedData.data : defaultDrawingData
  return Nano2DrawingBlockSchema.parse({
    ...block,
    data,
    type: nano2DrawingBlockType,
    text: typeof block.text === 'string' ? block.text : drawingText(data.strokes.length),
  })
}

function renderDrawingCanvas(
  canvas: HTMLCanvasElement,
  data: Nano2DrawingData,
  draftStroke: Nano2DrawingStroke | null,
): void {
  const context = canvas.getContext('2d')
  if (!context) return

  context.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of [...data.strokes, ...(draftStroke ? [draftStroke] : [])]) {
    drawStroke(context, stroke)
  }
}

function drawStroke(context: CanvasRenderingContext2D, stroke: Nano2DrawingStroke): void {
  const [first, ...rest] = stroke.points
  if (!first) return

  context.beginPath()
  context.moveTo(first[0], first[1])
  for (const point of rest) context.lineTo(point[0], point[1])
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = stroke.width
  context.strokeStyle = stroke.color
  context.stroke()
}

function canvasPoint(canvas: HTMLCanvasElement, event: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect()
  const x = (event.clientX - rect.left) * canvas.width / Math.max(1, rect.width)
  const y = (event.clientY - rect.top) * canvas.height / Math.max(1, rect.height)
  return [
    Math.max(0, Math.min(canvas.width, Math.round(x))),
    Math.max(0, Math.min(canvas.height, Math.round(y))),
  ]
}

function sampleStroke(data: Nano2DrawingData, index: number): Nano2DrawingStroke {
  const inset = 24 + (index % 4) * 14
  const y = Math.min(data.height - 24, 34 + (index % 5) * 24)
  return {
    color: index % 2 === 0 ? '#d95b56' : '#315f9c',
    points: [
      [inset, y],
      [Math.round(data.width * 0.38), Math.max(18, y - 18)],
      [Math.round(data.width * 0.66), Math.min(data.height - 18, y + 22)],
      [data.width - inset, Math.min(data.height - 18, y + 2)],
    ],
    width: 4,
  }
}

function drawingButton(label: string, icon: Parameters<typeof lucideIconElement>[0]): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano2-drawing-button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.append(lucideIconElement(icon, 'nano2-drawing-button-icon'))
  return button
}

function drawingText(strokeCount: number): string {
  return `${strokeCount} drawing stroke${strokeCount === 1 ? '' : 's'}`
}

function isDrawingNode(node: ProseMirrorNode): boolean {
  return node.type.name === nanoNodeNames.customBlock && node.attrs.customType === nano2DrawingBlockType
}

function preventMouseBlur(event: MouseEvent): void {
  event.preventDefault()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
