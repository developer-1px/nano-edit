import { EditorView } from 'prosemirror-view'
import { createNanoInputRuntime } from '../input/runtime'
import { createNanoInspectorRuntime } from '../inspector/runtime'
import { createNanoKeymapRuntime } from '../keyboard/runtime'
import { createNanoSlashCommandRuntime } from './slash-command'
import {
  createNanoEngineRuntime,
  type NanoEngineRuntime,
} from '../engine/runtime'
import { createNanoViewCommandRunners } from './command-runners'
import { createNanoViewContext } from './context-init'
import { createNanoEditorAttributes } from './editor-attributes'
import type { NanoViewHandle, NanoViewOptions } from './context'
import { createNanoEditorState } from './editor-state'
import {
  destroyNanoView,
  installNanoSlashCommandListeners,
} from './lifecycle'
import {
  destroyMountedNanoView,
  forgetMountedNanoView,
  rememberMountedNanoView,
} from './mount-registry'
import { installNanoShell } from './shell'

export function createNanoView(options: NanoViewOptions): NanoViewHandle {
  destroyMountedNanoView(options.mount)
  const ctx = createNanoViewContext(options)
  const inspector = createNanoInspectorRuntime(ctx)
  const slashCommands = createNanoSlashCommandRuntime(ctx)
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
  const input = createNanoInputRuntime(ctx, inspector, {
    restoreHistory: (direction) => engine().restoreHistory(direction),
    runMarkCommand: runners.runMarkCommand,
    toggleCollapsedBlock: (id) => engine().toggleCollapsedBlock(id),
  })

  engineRuntime = createNanoEngineRuntime(ctx, {
    createEditorState: (doc) => createNanoEditorState(ctx, input, keymaps, doc),
    inspector,
  })

  installNanoSlashCommandListeners(ctx, slashCommands)
  installNanoShell(options, ctx, {
    engine,
    inspector,
    runners,
  })
  ctx.view = new EditorView(ctx.editor, {
    state: createNanoEditorState(ctx, input, keymaps),
    attributes: createNanoEditorAttributes(options),
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
