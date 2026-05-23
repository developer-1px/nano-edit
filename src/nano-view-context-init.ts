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
    toolbar: document.createElement('div'),
    blockPicker: document.createElement('div'),
    editor: document.createElement('div'),
    shell: null as unknown as NanoShell,
    indexOutput: null as unknown as HTMLElement,
    markdownOutput: null as unknown as HTMLElement,
    view: null as unknown as EditorView,
    lastTextMergePath: null as Pointer | null,
    lastTextMergeAt: 0,
    indexSearchQuery: '',
    blockPickerMode: 'insert',
    gutterPickerAction: null,
    gutterPickerBlockId: null as string | null,
    gutterPickerOptionId: null as string | null,
    gutterPickerTypeahead: '',
    gutterPickerTypeaheadAt: 0,
    collapsedBlockIds: new Set<string>(),
    blockAddClickListener: () => undefined,
    blockHandleClickListener: () => undefined,
    blockInsertHoverListener: () => undefined,
    blockInsertKeydownListener: () => undefined,
    gutterOutsideClickListener: () => undefined,
  }
}
