import { NodeSelection, Plugin, type EditorState, type Transaction } from 'prosemirror-state'
import { parseMarkdownImage } from '../codecs/markdown/nano-markdown-image'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../adapters/prosemirror/prosemirror-schema'

export interface Nano2ImageAttrs {
  alt?: string
  destinationStyle?: 'angle'
  src: string
  title?: string
}

export function nano2ImagePlugin(): Plugin {
  return new Plugin({
    props: {
      handlePaste: (view, event) => {
        const attrs = imageAttrsFromClipboard(event.clipboardData)
        if (!attrs) return false

        const transaction = nano2SetImageTransaction(view.state, attrs)
        if (!transaction) return false

        event.preventDefault()
        view.dispatch(transaction.scrollIntoView())
        return true
      },
    },
  })
}

export function nano2SetImageTransaction(state: EditorState, attrs: Nano2ImageAttrs): Transaction | null {
  const imageType = nanoSchema.nodes[nanoNodeNames.image]
  if (!imageType || !attrs.src.trim()) return null

  const { $from } = state.selection
  if (!$from.parent.isTextblock) return null

  const blockPosition = $from.before()
  const block = $from.parent
  const image = imageType.create({
    id: block.attrs.id ?? null,
    src: attrs.src.trim(),
    alt: attrs.alt ?? '',
    destinationStyle: attrs.destinationStyle ?? '',
    title: attrs.title ?? '',
  })
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, image)
  transaction.setSelection(NodeSelection.create(transaction.doc, blockPosition))
  return transaction
}

function imageAttrsFromClipboard(data: DataTransfer | null): Nano2ImageAttrs | null {
  if (!data) return null

  return markdownImageAttrs(data.getData('text/markdown'))
    ?? markdownImageAttrs(data.getData('text/plain'))
    ?? htmlImageAttrs(data.getData('text/html'))
}

function markdownImageAttrs(text: string): Nano2ImageAttrs | null {
  const image = parseMarkdownImage(text.trim())
  return image ? { src: image.src, alt: image.alt, destinationStyle: image.destinationStyle, title: image.title } : null
}

function htmlImageAttrs(html: string): Nano2ImageAttrs | null {
  if (!html.trim()) return null

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const image = doc.querySelector('img[src]')
  const src = image?.getAttribute('src')?.trim()
  if (!src) return null

  return {
    src,
    alt: image?.getAttribute('alt') ?? '',
    title: image?.getAttribute('title') ?? '',
  }
}
