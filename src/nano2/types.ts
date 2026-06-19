import type { NanoDocumentEngine } from '../entities/document/nano-document'
import type { NanoDocumentChange } from '../entities/document/nano-document-change'

export interface Nano2ViewOptions {
  mount: HTMLElement
  engine: NanoDocumentEngine
  ariaLabel?: string
  onLocalChange?: (change: NanoDocumentChange) => void
  profile?: Nano2ViewProfile
  spellcheck?: boolean
}

export type Nano2ViewProfile = 'clever' | 'default' | 'menus' | 'minimal'

export interface Nano2ViewHandle {
  destroy(): void
  focus(): void
}
