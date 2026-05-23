import { EditorView } from 'prosemirror-view'
import { createNanoGutterRuntime } from './nano-view-gutter-runtime'
import { createNanoInputRuntime } from './nano-view-input-runtime'
import { createNanoInspectorRuntime } from './nano-view-inspector-runtime'
import { createNanoKeymapRuntime } from './nano-view-keymap-runtime'
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
import {
  destroyMountedNanoView,
  forgetMountedNanoView,
  rememberMountedNanoView,
} from './nano-view-mount-registry'
import { installNanoShell } from './nano-view-shell'

export function createNanoView(options: NanoViewOptions): NanoViewHandle {
  destroyMountedNanoView(options.mount)
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
  })
  const input = createNanoInputRuntime(ctx, gutter, inspector, {
    restoreHistory: (direction) => engine().restoreHistory(direction),
    runMarkCommand: runners.runMarkCommand,
    toggleCollapsedBlock: (id) => engine().toggleCollapsedBlock(id),
  })

  engineRuntime = createNanoEngineRuntime(ctx, {
    createEditorState: (doc) => createNanoEditorState(ctx, input, keymaps, doc),
    inspector,
  })

  installNanoGutterListeners(ctx, gutter)
  installNanoShell(options, ctx, {
    engine,
    inspector,
    runners,
  })
  ctx.view = new EditorView(ctx.editor, {
    state: createNanoEditorState(ctx, input, keymaps),
    attributes: {
      class: 'nano-document',
      role: 'textbox',
      'aria-multiline': 'true',
      spellcheck: 'false',
    },
    dispatchTransaction: (transaction) => engine().dispatchProseMirrorTransaction(transaction),
  })
  ctx.editor.addEventListener('keydown', ctx.slashKeydownListener, true)
  ctx.shell.syncInspectorChrome()
  engine().refreshInspector()

  let handle: NanoViewHandle
  handle = {
    destroy: () => {
      forgetMountedNanoView(options.mount, handle)
      destroyNanoView(ctx)
    },
  }
  rememberMountedNanoView(options.mount, handle)
  return handle
}
