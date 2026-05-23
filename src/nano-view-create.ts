import { EditorView } from 'prosemirror-view'
import { createNanoGutterRuntime } from './nano-view-gutter-runtime'
import { createNanoInputRuntime } from './nano-view-input-runtime'
import { createNanoInspectorRuntime } from './nano-view-inspector-runtime'
import { createNanoKeymapRuntime } from './nano-view-keymap-runtime'
import { createNanoToolbarRuntime } from './nano-view-toolbar-runtime'
import {
  createNanoEngineRuntime,
  type NanoEngineRuntime,
} from './nano-view-engine-runtime'
import { createNanoViewCommandRunners } from './nano-view-command-runners'
import { createNanoViewContext } from './nano-view-context-init'
import type { NanoViewHandle, NanoViewOptions } from './nano-view-context'
import { createNanoEditorState } from './nano-view-editor-state'
import {
  destroyNanoView,
  installNanoGutterListeners,
} from './nano-view-lifecycle'
import { installNanoShell } from './nano-view-shell'

export function createNanoView(options: NanoViewOptions): NanoViewHandle {
  const ctx = createNanoViewContext(options)
  const inspector = createNanoInspectorRuntime(ctx)
  const gutter = createNanoGutterRuntime(ctx)
  let engineRuntime: NanoEngineRuntime
  const engine = () => engineRuntime
  const keymaps = createNanoKeymapRuntime(ctx, {
    focusActiveMarkdownSource: () => inspector.focusActiveMarkdownSource(),
    restoreHistory: (direction) => engine().restoreHistory(direction),
  })
  const runners = createNanoViewCommandRunners(ctx, keymaps, {
    engine,
    inspector,
    toolbar: () => toolbar,
  })
  const toolbar = createNanoToolbarRuntime(ctx, {
    copyMarkdown: () => engine().copyMarkdown(),
    restoreHistory: (direction) => engine().restoreHistory(direction),
    runBlockTemplate: runners.runBlockTemplate,
    runBlockPickerTemplate: runners.runBlockPickerTemplate,
    runDeleteActiveBlock: runners.runDeleteActiveBlock,
    runDuplicateActiveBlock: runners.runDuplicateActiveBlock,
    runFocusActiveMarkdownSource: runners.runFocusActiveMarkdownSource,
    runIndentActiveBlock: runners.runIndentActiveBlock,
    runMarkCommand: runners.runMarkCommand,
    runMoveActiveBlock: runners.runMoveActiveBlock,
  })
  const input = createNanoInputRuntime(ctx, gutter, inspector, {
    restoreHistory: (direction) => engine().restoreHistory(direction),
    runMarkCommand: runners.runMarkCommand,
    toggleCollapsedBlock: (id) => engine().toggleCollapsedBlock(id),
  })

  engineRuntime = createNanoEngineRuntime(ctx, {
    createEditorState: (doc) => createNanoEditorState(ctx, input, keymaps, doc),
    inspector,
    syncGutterPickerWithSelection: (state) => gutter.syncGutterPickerWithSelection(state),
    toolbar,
  })

  installNanoGutterListeners(ctx, gutter)
  installNanoShell(options, ctx, gutter, {
    engine,
    inspector,
    runners,
  })
  toolbar.installToolbar()
  ctx.view = new EditorView(ctx.editor, {
    state: createNanoEditorState(ctx, input, keymaps),
    attributes: {
      class: 'markdown-body',
      role: 'textbox',
      'aria-multiline': 'true',
      spellcheck: 'false',
    },
    dispatchTransaction: (transaction) => engine().dispatchProseMirrorTransaction(transaction),
  })
  ctx.editor.addEventListener('click', ctx.blockAddClickListener)
  ctx.editor.addEventListener('click', ctx.blockHandleClickListener)
  ctx.editor.addEventListener('mouseover', ctx.blockInsertHoverListener)
  ctx.editor.addEventListener('keydown', ctx.blockInsertKeydownListener, true)
  document.addEventListener('click', ctx.gutterOutsideClickListener)
  ctx.shell.syncInspectorChrome()
  engine().refreshInspector()

  return {
    destroy: () => destroyNanoView(ctx),
  }
}
