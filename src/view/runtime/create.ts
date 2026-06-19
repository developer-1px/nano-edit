import { baseKeymap } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { prosemirrorDocFromNano } from '../../adapters/prosemirror/prosemirror-document'
import { prosemirrorSelectionFromNano } from '../../adapters/prosemirror/prosemirror-selection'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'
import { createBlockOptionRegistry } from '../../blocks/nano-block-options'
import { nanoCommands } from '../../commands/registry'
import { createNanoEditorKitFromCapabilityProfile } from '../../engine/capability-profile-kit'
import { defaultNanoEditorKit } from '../../engine/default-kit'
import {
  canIndentActiveBlock,
  canMoveActiveBlock,
} from '../block-move/checks'
import { createNanoInputRuntime } from '../input/runtime'
import {
  createNanoInspectorRuntime,
  type NanoInspectorRuntime,
} from '../inspector/runtime'
import { createNanoKeymapRuntime } from '../keyboard/runtime'
import { activeBlockId } from '../selection/active-block'
import {
  createNanoShell,
  type NanoShell,
} from '../shell/shell'
import { createNanoSlashCommandRuntime } from './slash-command'
import {
  createNanoEngineRuntime,
  type NanoEngineRuntime,
} from '../engine/runtime'
import {
  createNanoViewCommandRunners,
  type NanoViewCommandRunners,
} from './command-runners'
import { createNanoCustomBlockNodeViews } from './custom-block-node-view'
import { createNanoEditorAttributes } from './editor-attributes'
import { createNanoTableNodeViews } from './table-node-view'
import type { NanoViewContext } from './context'
import type { NanoViewHandle, NanoViewOptions } from './types'
import { destroyNanoView } from './lifecycle'
import {
  destroyMountedNanoView,
  forgetMountedNanoView,
  rememberMountedNanoView,
} from './mount-registry'

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

  ctx.slashKeydownListener = (event) => slashCommands.handleSlashKeydown(event)
  installNanoShell(options, ctx, {
    engine,
    inspector,
    runners,
  })
  ctx.view = new EditorView(ctx.editor, {
    state: createNanoEditorState(ctx, input, keymaps),
    attributes: createNanoEditorAttributes(options),
    dispatchTransaction: (transaction) => engine().dispatchProseMirrorTransaction(transaction),
    nodeViews: {
      ...createNanoTableNodeViews(),
      ...createNanoCustomBlockNodeViews(ctx),
    },
  })
  ctx.editor.addEventListener('keydown', ctx.slashKeydownListener, true)
  ctx.shell.syncInspectorChrome()
  engine().refreshInspector()
  ctx.engineUnsubscribe = ctx.engine.subscribe(() => {
    if (ctx.destroyed || ctx.suppressEngineSync) return
    engine().syncEditorFromEngine()
  })

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

function createNanoViewContext(options: NanoViewOptions): NanoViewContext {
  const kit = options.capabilityProfile
    ? createNanoEditorKitFromCapabilityProfile(options.capabilityProfile)
    : defaultNanoEditorKit
  const shell = requiredRuntimeSlot<NanoShell>('shell')
  const indexOutput = requiredRuntimeSlot<HTMLElement>('indexOutput')
  const markdownOutput = requiredRuntimeSlot<HTMLElement>('markdownOutput')
  const view = requiredRuntimeSlot<EditorView>('view')
  const root = document.createElement('section')
  root.className = 'nano'
  const editor = document.createElement('div')
  editor.className = 'nano-editor'

  return {
    engine: options.engine,
    kit,
    blockRegistry: createBlockOptionRegistry(kit.blockOptions),
    customBlocks: options.customBlocks ?? [],
    onLocalChange: options.onLocalChange ?? (() => undefined),
    root,
    editor,
    get shell() {
      return shell.get()
    },
    set shell(value) {
      shell.set(value)
    },
    get indexOutput() {
      return indexOutput.get()
    },
    set indexOutput(value) {
      indexOutput.set(value)
    },
    get markdownOutput() {
      return markdownOutput.get()
    },
    set markdownOutput(value) {
      markdownOutput.set(value)
    },
    get view() {
      return view.get()
    },
    set view(value) {
      view.set(value)
    },
    destroyed: false,
    engineUnsubscribe: null,
    suppressEngineSync: false,
    composing: false,
    lastCompositionAt: 0,
    lastTextMergePath: null,
    lastTextMergeAt: 0,
    indexSearchQuery: '',
    collapsedBlockIds: new Set<string>(),
    slashKeydownListener: () => undefined,
  }
}

function requiredRuntimeSlot<T>(name: string): { get: () => T; set: (value: T) => void } {
  let current: T | null = null
  return {
    get: () => {
      if (current === null) throw new Error(`Nano view ${name} was used before initialization`)
      return current
    },
    set: (value) => {
      current = value
    },
  }
}

function createNanoEditorState(
  ctx: NanoViewContext,
  input: ReturnType<typeof createNanoInputRuntime>,
  keymaps: ReturnType<typeof createNanoKeymapRuntime>,
  doc: ProseMirrorNode = prosemirrorDocFromNano(ctx.engine.value),
): EditorState {
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: prosemirrorSelectionFromNano(doc, ctx.engine.selection?.snapshot()),
    plugins: [
      input.historyInputPlugin(),
      input.shortcutInputPlugin(),
      input.tableCellEditPlugin(),
      input.sourceRevealPlugin(),
      input.blockClickPlugin(),
      input.activeBlockPlugin(),
      keymap({
        Enter: keymaps.enterCommand(),
        Backspace: keymaps.backspaceCommand(),
        Delete: keymaps.deleteCommand(),
        Escape: keymaps.selectActiveBlockCommand(),
        Tab: keymaps.indentActiveBlockCommand('in'),
        'Shift-Tab': keymaps.indentActiveBlockCommand('out'),
        ArrowUp: keymaps.selectAdjacentBlockCommand('up'),
        ArrowDown: keymaps.selectAdjacentBlockCommand('down'),
        ...keymaps.markKeymapCommands(),
        ...keymaps.blockKeymapCommands(),
        'Alt-Mod-ArrowUp': keymaps.moveActiveBlockCommand('up'),
        'Alt-Mod-ArrowDown': keymaps.moveActiveBlockCommand('down'),
        'Shift-Mod-m': keymaps.focusActiveMarkdownSourceCommand(),
        'Shift-Mod-d': keymaps.duplicateActiveBlockCommand(),
        'Shift-Mod-Backspace': keymaps.deleteActiveBlockCommand(),
        'Mod-k': keymaps.openCommandPaletteCommand(),
        'Mod-z': keymaps.historyCommand('undo'),
        'Shift-Mod-z': keymaps.historyCommand('redo'),
        'Mod-y': keymaps.historyCommand('redo'),
      }),
      keymap(baseKeymap),
    ],
  })
}

function installNanoShell(
  options: NanoViewOptions,
  ctx: NanoViewContext,
  deps: {
    engine: () => NanoEngineRuntime
    inspector: NanoInspectorRuntime
    runners: NanoViewCommandRunners
  },
): void {
  const shell = requiredRuntimeSlot<NanoShell>('shell command target')
  const createdShell = createNanoShell({
    commandAnchorRect: () => nanoCommandAnchorRect(ctx),
    commands: (context) => {
      const state = ctx.view.state
      return nanoCommands({
        activeBlockId: activeBlockId(state),
        blockId: context.blockId,
        blockOptions: ctx.kit.blockOptions,
        canIndentBlock: (direction) => canIndentActiveBlock(state, direction, ctx.collapsedBlockIds),
        canMoveBlock: (direction) => canMoveActiveBlock(state, direction, ctx.collapsedBlockIds),
        hasTextSelection: !state.selection.empty,
        mode: context.mode,
        actions: {
          changeBlockById: deps.runners.runChangeBlockById,
          copyMarkdown: () => deps.engine().copyMarkdown(),
          deleteBlock: deps.runners.runDeleteActiveBlock,
          duplicateBlock: deps.runners.runDuplicateActiveBlock,
          focusMarkdownSource: deps.runners.runFocusActiveMarkdownSource,
          indentBlock: deps.runners.runIndentActiveBlock,
          insertBlock: deps.runners.runInsertBlockAfterActive,
          moveBlock: deps.runners.runMoveActiveBlock,
          redo: () => deps.engine().restoreHistory('redo'),
          runMark: deps.runners.runMarkCommand,
          showInspector: (tab) => shell.get().showInspector(tab),
          togglePinnedInspector: () => {
            shell.get().setInspectorMode(ctx.root.dataset.inspector === 'pinned' ? 'floating' : 'pinned')
          },
          undo: () => deps.engine().restoreHistory('undo'),
        },
      })
    },
    onCommandClose: () => ctx.view.focus(),
    onIndexSearch: (query) => {
      ctx.indexSearchQuery = query
      deps.inspector.renderIndex()
    },
    inspector: options.inspector ?? 'enabled',
    root: ctx.root,
  })
  shell.set(createdShell)
  ctx.shell = createdShell
  ctx.indexOutput = ctx.shell.indexOutput
  ctx.markdownOutput = ctx.shell.markdownOutput
  ctx.root.append(
    ctx.editor,
    ctx.shell.inspectorElement,
    ctx.shell.inspectorTrigger,
    ctx.shell.commandPalette,
  )
  options.mount.replaceChildren(ctx.root)
}

function nanoCommandAnchorRect(ctx: NanoViewContext): DOMRect | null {
  try {
    const position = ctx.view.state.selection.from
    const coords = ctx.view.coordsAtPos(position)
    return new DOMRect(coords.left, coords.bottom, coords.right - coords.left, coords.bottom - coords.top)
  } catch {
    return null
  }
}
