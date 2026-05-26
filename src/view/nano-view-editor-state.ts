import { baseKeymap } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import type { NanoViewContext } from './nano-view-context'
import type { NanoInputRuntime } from './nano-view-input-runtime'
import type { NanoKeymapRuntime } from './nano-view-keymap-runtime'
import {
  nanoSchema,
  prosemirrorDocFromNano,
  prosemirrorSelectionFromNano,
} from '../adapters/prosemirror/prosemirror-nano'

export function createNanoEditorState(
  ctx: NanoViewContext,
  input: NanoInputRuntime,
  keymaps: NanoKeymapRuntime,
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

export function nanoCommandAnchorRect(ctx: NanoViewContext): DOMRect | null {
  try {
    const position = ctx.view.state.selection.from
    const coords = ctx.view.coordsAtPos(position)
    return new DOMRect(coords.left, coords.bottom, coords.right - coords.left, coords.bottom - coords.top)
  } catch {
    return null
  }
}
