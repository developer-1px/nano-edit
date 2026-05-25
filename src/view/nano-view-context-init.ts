import type { EditorView } from 'prosemirror-view'
import type { Pointer } from 'zod-crud'
import type { NanoShell } from './nano-command-surface'
import type {
  NanoViewContext,
  NanoViewOptions,
} from './nano-view-context'

export function createNanoViewContext(options: NanoViewOptions): NanoViewContext {
  return {
    engine: options.engine,
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
