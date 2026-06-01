import type { EditorView } from 'prosemirror-view'
import type { Pointer } from 'zod-crud'
import { createBlockOptionRegistry } from '../../blocks/nano-block-options'
import { defaultNanoEditorKit } from '../../engine/default-kit'
import type { NanoShell } from '../shell/shell'
import type {
  NanoViewContext,
  NanoViewOptions,
} from './context'

export function createNanoViewContext(options: NanoViewOptions): NanoViewContext {
  const kit = options.kit ?? defaultNanoEditorKit
  return {
    engine: options.engine,
    kit,
    blockRegistry: createBlockOptionRegistry(kit.blockOptions),
    root: document.createElement('section'),
    editor: document.createElement('div'),
    shell: null as unknown as NanoShell,
    indexOutput: null as unknown as HTMLElement,
    markdownOutput: null as unknown as HTMLElement,
    view: null as unknown as EditorView,
    destroyed: false,
    lastTextMergePath: null as Pointer | null,
    lastTextMergeAt: 0,
    indexSearchQuery: '',
    collapsedBlockIds: new Set<string>(),
    slashKeydownListener: () => undefined,
  }
}
