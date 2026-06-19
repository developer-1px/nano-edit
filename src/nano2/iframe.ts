import { ExternalLink, RefreshCw } from 'lucide'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view'
import { z } from 'zod'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { NanoCustomBlockSchema, type NanoCustomBlock } from '../entities/block/schema/nano-block-schema'
import { lucideIconElement } from '../view/icons'

export const nano2IFrameBlockType = 'nano2.iframe'

export const Nano2IFrameDataSchema = z.object({
  allow: z.string().optional(),
  height: z.number().int().min(80).max(1200),
  sandbox: z.string().optional(),
  src: z.string().min(1).refine(isSafeIFrameSrc, 'expected a safe iframe src'),
  title: z.string().min(1).max(140),
  width: z.number().int().min(120).max(1600),
}).strict()

export const Nano2IFrameBlockSchema = NanoCustomBlockSchema.extend({
  data: Nano2IFrameDataSchema,
  type: z.literal(nano2IFrameBlockType),
}).strict()

export type Nano2IFrameBlock = z.infer<typeof Nano2IFrameBlockSchema>
export type Nano2IFrameData = z.infer<typeof Nano2IFrameDataSchema>

export const nano2IFrameSampleUpdate: Nano2IFrameData = {
  allow: 'fullscreen',
  height: 315,
  sandbox: 'allow-same-origin allow-scripts allow-presentation',
  src: 'https://example.com/nano2-iframe-updated',
  title: 'Updated Nano2 iframe',
  width: 560,
}

const defaultIFrameData: Nano2IFrameData = {
  allow: 'fullscreen',
  height: 315,
  sandbox: 'allow-same-origin allow-scripts allow-presentation',
  src: 'https://example.com/nano2-iframe',
  title: 'Nano2 iframe',
  width: 560,
}

export function nano2IFrameNodeViews(): Record<string, NodeViewConstructor> {
  return {
    [nanoNodeNames.customBlock]: (node, view, getPos) => createNano2IFrameNodeView(node, view, getPos),
  }
}

export function nano2IFrameBlockFromCustomBlock(block: NanoCustomBlock): Nano2IFrameBlock {
  const parsedData = Nano2IFrameDataSchema.safeParse(block.data)
  const data = parsedData.success ? parsedData.data : defaultIFrameData
  return Nano2IFrameBlockSchema.parse({
    ...block,
    data,
    text: typeof block.text === 'string' ? block.text : iFrameText(data),
    type: nano2IFrameBlockType,
  })
}

export function nano2IFrameBlockWithAttrs(
  block: NanoCustomBlock,
  attrs: Partial<Nano2IFrameData>,
): Nano2IFrameBlock {
  const iframe = nano2IFrameBlockFromCustomBlock(block)
  const data = Nano2IFrameDataSchema.parse({
    ...iframe.data,
    ...attrs,
  })
  return Nano2IFrameBlockSchema.parse({
    ...iframe,
    data,
    text: iFrameText(data),
  })
}

function createNano2IFrameNodeView(
  node: ProseMirrorNode,
  view: EditorView,
  getPos: (() => number | undefined) | boolean,
): NodeView {
  if (!isIFrameNode(node)) return createFallbackCustomNodeView(node)

  let currentNode = node
  let iframeBlock = iFrameBlockFromNode(currentNode)

  const dom = document.createElement('section')
  dom.className = 'nano-block nano2-iframe-block'
  dom.contentEditable = 'false'
  dom.dataset.id = iframeBlock.id
  dom.dataset.customBlockType = nano2IFrameBlockType

  const toolbar = document.createElement('div')
  toolbar.className = 'nano2-iframe-toolbar'

  const meta = document.createElement('span')
  meta.className = 'nano2-iframe-meta'

  const updateButton = iFrameButton('Use sample iframe attrs', RefreshCw)
  const openButton = document.createElement('a')
  openButton.className = 'nano2-iframe-button'
  openButton.target = '_blank'
  openButton.rel = 'noreferrer'
  openButton.title = 'Open iframe source'
  openButton.setAttribute('aria-label', 'Open iframe source')
  openButton.append(lucideIconElement(ExternalLink, 'nano2-iframe-button-icon'))

  const frame = document.createElement('iframe')
  frame.className = 'nano2-iframe-frame'
  frame.loading = 'lazy'
  frame.referrerPolicy = 'no-referrer'

  toolbar.append(meta, updateButton, openButton)
  dom.append(toolbar, frame)

  const updateAttrs = (event: MouseEvent) => {
    event.preventDefault()
    commitIFrame(nano2IFrameBlockWithAttrs(iframeBlock, nano2IFrameSampleUpdate), view, getPos)
  }

  updateButton.addEventListener('mousedown', preventMouseBlur)
  updateButton.addEventListener('click', updateAttrs)
  openButton.addEventListener('mousedown', preventMouseBlur)

  render()

  return {
    dom,
    destroy() {
      updateButton.removeEventListener('mousedown', preventMouseBlur)
      updateButton.removeEventListener('click', updateAttrs)
      openButton.removeEventListener('mousedown', preventMouseBlur)
      dom.replaceChildren()
    },
    ignoreMutation: () => true,
    stopEvent: (event) => event.target instanceof Node && dom.contains(event.target),
    update(nextNode) {
      if (!isIFrameNode(nextNode)) return false
      currentNode = nextNode
      iframeBlock = iFrameBlockFromNode(currentNode)
      render()
      return true
    },
  }

  function render(): void {
    const { data } = iframeBlock
    dom.dataset.src = data.src
    dom.dataset.title = data.title
    dom.dataset.width = String(data.width)
    dom.dataset.height = String(data.height)
    meta.textContent = data.title
    openButton.href = data.src
    frame.src = data.src
    frame.title = data.title
    frame.width = String(data.width)
    frame.height = String(data.height)
    if (data.allow) frame.setAttribute('allow', data.allow)
    else frame.removeAttribute('allow')
    if (data.sandbox) frame.setAttribute('sandbox', data.sandbox)
    else frame.removeAttribute('sandbox')
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

function commitIFrame(
  block: Nano2IFrameBlock,
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
  }).setMeta('inputType', 'nano2IFrame:update'))
}

function iFrameBlockFromNode(node: ProseMirrorNode): Nano2IFrameBlock {
  return nano2IFrameBlockFromCustomBlock({
    id: typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : 'nano2-iframe',
    type: nano2IFrameBlockType,
    ...(typeof node.attrs.text === 'string' ? { text: node.attrs.text } : {}),
    ...(Array.isArray(node.attrs.marks) ? { marks: node.attrs.marks } : {}),
    ...(isRecord(node.attrs.data) ? { data: node.attrs.data } : {}),
  })
}

function iFrameButton(label: string, icon: Parameters<typeof lucideIconElement>[0]): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano2-iframe-button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.append(lucideIconElement(icon, 'nano2-iframe-button-icon'))
  return button
}

function iFrameText(data: Nano2IFrameData): string {
  return data.title
}

function isIFrameNode(node: ProseMirrorNode): boolean {
  return node.type.name === nanoNodeNames.customBlock && node.attrs.customType === nano2IFrameBlockType
}

function preventMouseBlur(event: MouseEvent): void {
  event.preventDefault()
}

function isSafeIFrameSrc(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
