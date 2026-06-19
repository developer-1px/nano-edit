import type { NanoDocumentEngine } from '../../entities/document/nano-document'
import type { NanoDocumentChange } from '../../entities/document/nano-document-change'
import type {
  NanoDocumentCommandCommitResult,
  NanoDocumentCommandOptions,
} from '../../entities/document/nano-document-command'
import type { NanoCustomBlock } from '../../entities/document/nano-document-model'
import type { NanoCapabilityProfileOptions } from '../../engine/capability-profile'

export type NanoCustomBlockReplaceOptions = NanoDocumentCommandOptions
export type NanoViewInspector = 'disabled' | 'enabled'

export interface NanoCustomBlockRenderContext<TBlock extends NanoCustomBlock = NanoCustomBlock> {
  id: string
  onDestroy(cleanup: () => void): void
  readonly replaceBlock: (
    block: TBlock,
    options?: NanoCustomBlockReplaceOptions,
  ) => NanoDocumentCommandCommitResult
  readonly: true
  type: NanoCustomBlock['type']
}

export interface NanoCustomBlockDescriptor<TBlock extends NanoCustomBlock = NanoCustomBlock> {
  type: TBlock['type']
  render(block: TBlock, context: NanoCustomBlockRenderContext<TBlock>): HTMLElement
  validateBlock?: (block: NanoCustomBlock) => block is TBlock
}

export interface NanoViewOptions {
  mount: HTMLElement
  engine: NanoDocumentEngine
  ariaLabel?: string
  capabilityProfile?: NanoCapabilityProfileOptions
  customBlocks?: readonly NanoCustomBlockDescriptor[]
  inspector?: NanoViewInspector
  onLocalChange?: (change: NanoDocumentChange) => void
  spellcheck?: boolean
}

export interface NanoViewHandle {
  destroy(): void
}
