import type { NanoDocumentEngine } from '../entities/document/nano-document'
import type { NanoDocumentChange } from '../entities/document/nano-document-change'

export interface Nano2ViewOptions {
  mount: HTMLElement
  engine: NanoDocumentEngine
  ariaLabel?: string
  onLocalChange?: (change: NanoDocumentChange) => void
  spellcheck?: boolean
}

export interface Nano2ViewHandle {
  destroy(): void
  focus(): void
}
