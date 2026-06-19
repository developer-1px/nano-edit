import type { NanoDocumentEngine } from '../entities/document/nano-document'
import type { NanoDocumentChange } from '../entities/document/nano-document-change'
import type { NanoDocument } from '../entities/document/nano-document-model'

export interface Nano2ViewOptions {
  mount: HTMLElement
  engine: NanoDocumentEngine
  ariaLabel?: string
  validateDocument?: (document: NanoDocument) => boolean
  onLocalChange?: (change: NanoDocumentChange) => void
  profile?: Nano2ViewProfile
  spellcheck?: boolean
}

export type Nano2ViewProfile = 'clever' | 'default' | 'forced' | 'menus' | 'minimal' | 'slash' | 'syntax'

export interface Nano2ViewHandle {
  destroy(): void
  focus(): void
}
