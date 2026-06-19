import { Minus, Plus } from 'lucide'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view'
import { z } from 'zod'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { NanoCustomBlockSchema, type NanoCustomBlock } from '../entities/block/schema/nano-block-schema'
import { lucideIconElement } from '../view/icons'

export const nano2InteractiveViewBlockType = 'nano2.interactive-view'

export const Nano2InteractiveViewDataSchema = z.object({
  count: z.number().int().min(-999).max(999),
  label: z.string().min(1).max(120),
  tone: z.enum(['neutral', 'accent']).default('neutral'),
}).strict()

export const Nano2InteractiveViewBlockSchema = NanoCustomBlockSchema.extend({
  data: Nano2InteractiveViewDataSchema,
  type: z.literal(nano2InteractiveViewBlockType),
}).strict()

export type Nano2InteractiveViewBlock = z.infer<typeof Nano2InteractiveViewBlockSchema>
export type Nano2InteractiveViewData = z.infer<typeof Nano2InteractiveViewDataSchema>

const defaultInteractiveViewData: Nano2InteractiveViewData = {
  count: 0,
  label: 'Interactive node view',
  tone: 'neutral',
}

export function nano2InteractiveViewNodeViews(): Record<string, NodeViewConstructor> {
  return {
    [nanoNodeNames.customBlock]: (node, view, getPos) => createNano2InteractiveViewNodeView(node, view, getPos),
  }
}

export function nano2InteractiveViewBlockFromCustomBlock(block: NanoCustomBlock): Nano2InteractiveViewBlock {
  const parsedData = Nano2InteractiveViewDataSchema.safeParse(block.data)
  const data = parsedData.success ? parsedData.data : defaultInteractiveViewData
  return Nano2InteractiveViewBlockSchema.parse({
    ...block,
    data,
    text: typeof block.text === 'string' ? block.text : interactiveViewText(data),
    type: nano2InteractiveViewBlockType,
  })
}

export function nano2InteractiveViewBlockWithCount(
  block: NanoCustomBlock,
  count: number,
): Nano2InteractiveViewBlock {
  const interactiveView = nano2InteractiveViewBlockFromCustomBlock(block)
  const data = Nano2InteractiveViewDataSchema.parse({
    ...interactiveView.data,
    count,
  })
  return Nano2InteractiveViewBlockSchema.parse({
    ...interactiveView,
    data,
    text: interactiveViewText(data),
  })
}

export function nano2InteractiveViewBlockWithLabel(
  block: NanoCustomBlock,
  label: string,
): Nano2InteractiveViewBlock {
  const interactiveView = nano2InteractiveViewBlockFromCustomBlock(block)
  const data = Nano2InteractiveViewDataSchema.parse({
    ...interactiveView.data,
    label,
  })
  return Nano2InteractiveViewBlockSchema.parse({
    ...interactiveView,
    data,
    text: interactiveViewText(data),
  })
}

function createNano2InteractiveViewNodeView(
  node: ProseMirrorNode,
  view: EditorView,
  getPos: (() => number | undefined) | boolean,
): NodeView {
  if (!isInteractiveViewNode(node)) return createFallbackCustomNodeView(node)

  let currentNode = node
  let interactiveView = interactiveViewBlockFromNode(currentNode)

  const dom = document.createElement('section')
  dom.className = 'nano-block nano2-interactive-view'
  dom.contentEditable = 'false'
  dom.dataset.id = interactiveView.id
  dom.dataset.customBlockType = nano2InteractiveViewBlockType

  const controls = document.createElement('div')
  controls.className = 'nano2-interactive-controls'

  const decrementButton = interactiveButton('Decrement component value', Minus)
  const incrementButton = interactiveButton('Increment component value', Plus)

  const value = document.createElement('span')
  value.className = 'nano2-interactive-value'

  const label = document.createElement('div')
  label.className = 'nano2-interactive-label'
  label.contentEditable = 'true'
  label.spellcheck = true
  label.setAttribute('aria-label', 'Interactive view label')

  controls.append(decrementButton, value, incrementButton)
  dom.append(controls, label)

  const decrement = (event: MouseEvent) => {
    event.preventDefault()
    commitInteractiveView(nano2InteractiveViewBlockWithCount(interactiveView, interactiveView.data.count - 1), view, getPos)
  }
  const increment = (event: MouseEvent) => {
    event.preventDefault()
    commitInteractiveView(nano2InteractiveViewBlockWithCount(interactiveView, interactiveView.data.count + 1), view, getPos)
  }
  const commitLabel = () => {
    const text = (label.textContent ?? '').trim()
    if (!text || text === interactiveView.data.label) return
    commitInteractiveView(nano2InteractiveViewBlockWithLabel(interactiveView, text), view, getPos)
  }
  const handleLabelKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    label.blur()
  }

  decrementButton.addEventListener('mousedown', preventMouseBlur)
  decrementButton.addEventListener('click', decrement)
  incrementButton.addEventListener('mousedown', preventMouseBlur)
  incrementButton.addEventListener('click', increment)
  label.addEventListener('input', commitLabel)
  label.addEventListener('blur', commitLabel)
  label.addEventListener('keydown', handleLabelKeydown)

  render()

  return {
    dom,
    destroy() {
      decrementButton.removeEventListener('mousedown', preventMouseBlur)
      decrementButton.removeEventListener('click', decrement)
      incrementButton.removeEventListener('mousedown', preventMouseBlur)
      incrementButton.removeEventListener('click', increment)
      label.removeEventListener('input', commitLabel)
      label.removeEventListener('blur', commitLabel)
      label.removeEventListener('keydown', handleLabelKeydown)
      dom.replaceChildren()
    },
    ignoreMutation: () => true,
    stopEvent: (event) => event.target instanceof Node && dom.contains(event.target),
    update(nextNode) {
      if (!isInteractiveViewNode(nextNode)) return false
      currentNode = nextNode
      interactiveView = interactiveViewBlockFromNode(currentNode)
      render()
      return true
    },
  }

  function render(): void {
    const { data } = interactiveView
    dom.dataset.count = String(data.count)
    dom.dataset.label = data.label
    dom.dataset.tone = data.tone
    value.textContent = String(data.count)
    if (document.activeElement !== label && label.textContent !== data.label) {
      label.textContent = data.label
    }
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

function commitInteractiveView(
  block: Nano2InteractiveViewBlock,
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
  }).setMeta('inputType', 'nano2InteractiveView:update'))
}

function interactiveViewBlockFromNode(node: ProseMirrorNode): Nano2InteractiveViewBlock {
  return nano2InteractiveViewBlockFromCustomBlock({
    id: typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : 'nano2-interactive-view',
    type: nano2InteractiveViewBlockType,
    ...(typeof node.attrs.text === 'string' ? { text: node.attrs.text } : {}),
    ...(Array.isArray(node.attrs.marks) ? { marks: node.attrs.marks } : {}),
    ...(isRecord(node.attrs.data) ? { data: node.attrs.data } : {}),
  })
}

function interactiveButton(label: string, icon: Parameters<typeof lucideIconElement>[0]): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano2-interactive-button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.append(lucideIconElement(icon, 'nano2-interactive-button-icon'))
  return button
}

function interactiveViewText(data: Nano2InteractiveViewData): string {
  return `${data.label}: ${data.count}`
}

function isInteractiveViewNode(node: ProseMirrorNode): boolean {
  return node.type.name === nanoNodeNames.customBlock && node.attrs.customType === nano2InteractiveViewBlockType
}

function preventMouseBlur(event: MouseEvent): void {
  event.preventDefault()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
