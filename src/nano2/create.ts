import {
  baseKeymap,
  setBlockType,
  toggleMark,
} from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, TextSelection, type Command, type Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import type { Pointer, SelectionSnap } from '@interactive-os/json-document'
import {
  nanoDocumentChangeFromProseMirrorDoc,
  prosemirrorDocFromNano,
} from '../adapters/prosemirror/prosemirror-document'
import {
  nanoSelectionFromProseMirror,
  prosemirrorSelectionFromNano,
} from '../adapters/prosemirror/prosemirror-selection'
import { nanoSchema } from '../adapters/prosemirror/prosemirror-schema'
import {
  nanoMarkNames,
  nanoNodeNames,
} from '../adapters/prosemirror/prosemirror-names'
import {
  commitNanoDocumentChange,
  type NanoDocumentChange,
} from '../entities/document/nano-document-change'
import type { NanoDocument } from '../entities/document/nano-document-model'
import { splitTextblockTransaction } from '../view/keyboard/enter'
import { TEXT_MERGE_MS } from '../view/runtime/context'
import { nano2ImagePlugin } from './images'
import { nano2MarkdownShortcutPlugin } from './markdown-shortcuts'
import { Nano2MentionRuntime } from './mention'
import { nano2TaskPlugin } from './tasks'
import type { Nano2ViewHandle, Nano2ViewOptions } from './types'

export function createNano2View(options: Nano2ViewOptions): Nano2ViewHandle {
  const view = new Nano2View(options)
  return {
    destroy: () => view.destroy(),
    focus: () => view.focus(),
  }
}

class Nano2View {
  private readonly options: Nano2ViewOptions
  private readonly root = document.createElement('section')
  private readonly editor = document.createElement('div')
  private readonly mention: Nano2MentionRuntime
  private readonly view: EditorView
  private readonly unsubscribe: () => void
  private suppressEngineSync = false
  private destroyed = false
  private lastTextMergePath: Pointer | null = null
  private lastTextMergeAt = 0

  constructor(options: Nano2ViewOptions) {
    this.options = options
    this.root.className = 'nano nano2'
    this.editor.className = 'nano-editor nano2-editor'
    this.root.append(this.editor)
    this.mention = new Nano2MentionRuntime(this.root)
    options.mount.replaceChildren(this.root)

    this.view = new EditorView(this.editor, {
      state: this.createEditorState(options.engine.value),
      attributes: {
        'aria-label': options.ariaLabel ?? 'Nano2 editor',
        class: 'nano-document nano2-document',
        role: 'textbox',
        spellcheck: String(options.spellcheck ?? true),
      },
      dispatchTransaction: (transaction) => this.dispatchTransaction(transaction),
    })

    this.unsubscribe = options.engine.subscribe(() => {
      if (this.destroyed || this.suppressEngineSync) return
      this.syncEditorFromEngine()
    })
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.unsubscribe()
    this.mention.destroy()
    this.view.destroy()
    this.root.remove()
  }

  focus(): void {
    this.view.focus()
  }

  private createEditorState(document: NanoDocument): EditorState {
    const doc = this.createProseMirrorDocument(document)
    return EditorState.create({
      schema: nanoSchema,
      doc,
      selection: prosemirrorSelectionFromNano(doc, this.options.engine.selection?.snapshot()),
      plugins: [
        this.mention.plugin(),
        nano2MarkdownShortcutPlugin(),
        nano2ImagePlugin(),
        nano2TaskPlugin(),
        keymap({
          Enter: this.enterCommand(),
          End: this.textblockEndCommand(),
          'Mod-ArrowRight': this.textblockEndCommand(),
          'Shift-Enter': this.hardBreakCommand(),
          'Mod-Enter': this.hardBreakCommand(),
          'Shift-End': this.textblockEndCommand({ extend: true }),
          'Shift-Mod-ArrowRight': this.textblockEndCommand({ extend: true }),
          'Mod-b': this.toggleMarkCommand(nanoMarkNames.bold),
          'Mod-i': this.toggleMarkCommand(nanoMarkNames.italic),
          'Mod-u': this.toggleMarkCommand(nanoMarkNames.underline),
          'Mod-Shift-s': this.toggleMarkCommand(nanoMarkNames.strike),
          'Mod-e': this.toggleMarkCommand(nanoMarkNames.code),
          'Ctrl-Shift-0': this.setBlockTypeCommand(nanoNodeNames.paragraph),
          'Ctrl-Shift-1': this.setBlockTypeCommand(nanoNodeNames.heading, { level: 1 }),
          'Ctrl-Shift-2': this.setBlockTypeCommand(nanoNodeNames.heading, { level: 2 }),
          'Ctrl-Shift-3': this.setBlockTypeCommand(nanoNodeNames.heading, { level: 3 }),
          'Mod-Shift-8': this.toggleBlockTypeCommand(nanoNodeNames.listItem, { kind: 'bullet', indent: 0, marker: '-' }),
          'Mod-Shift-7': this.toggleBlockTypeCommand(nanoNodeNames.listItem, { kind: 'ordered', indent: 0, orderedMarker: '.', start: 1 }),
          'Mod-Shift-b': this.toggleBlockTypeCommand(nanoNodeNames.quote),
          'Mod-Alt-c': this.toggleBlockTypeCommand(nanoNodeNames.codeBlock),
          'Mod-z': this.historyCommand('undo'),
          'Shift-Mod-z': this.historyCommand('redo'),
          'Mod-y': this.historyCommand('redo'),
        }),
        keymap(baseKeymap),
      ],
    })
  }

  private createProseMirrorDocument(document: NanoDocument): ProseMirrorNode {
    return prosemirrorDocFromNano(document)
  }

  private dispatchTransaction(transaction: Transaction): void {
    const nextState = this.view.state.apply(transaction)
    this.view.updateState(nextState)

    const selection = nanoSelectionFromProseMirror(nextState.doc, nextState.selection)
    if (!transaction.docChanged) {
      this.restoreNanoSelection(selection)
      return
    }

    const change = nanoDocumentChangeFromProseMirrorDoc(this.options.engine.value, nextState.doc, {
      label: transactionLabel(transaction),
      origin: 'nano2-prosemirror-view',
      selection,
    })
    if (!change) {
      this.restoreNanoSelection(selection)
      return
    }

    const committed = this.runWithoutEngineSync(() => commitNanoDocumentChange(this.options.engine, change))
    if (!committed.ok) {
      this.syncEditorFromEngine()
      return
    }

    this.coalesceTextHistory(change)
    this.options.onLocalChange?.(change)
  }

  private syncEditorFromEngine(): void {
    this.view.updateState(this.createEditorState(this.options.engine.value))
  }

  private restoreHistory(direction: 'undo' | 'redo'): void {
    const restored = direction === 'undo'
      ? this.options.engine.history.undo()
      : this.options.engine.history.redo()
    if (restored) this.syncEditorFromEngine()
  }

  private restoreNanoSelection(selection: SelectionSnap | null): void {
    if (selection) this.options.engine.selection?.restore(selection)
  }

  private runWithoutEngineSync<T>(fn: () => T): T {
    const previous = this.suppressEngineSync
    this.suppressEngineSync = true
    try {
      return fn()
    } finally {
      this.suppressEngineSync = previous
    }
  }

  private enterCommand(): Command {
    return (state, dispatch) => {
      const transaction = splitTextblockTransaction(state)
      if (!transaction) return false
      if (dispatch) dispatch(transaction.scrollIntoView())
      return true
    }
  }

  private hardBreakCommand(): Command {
    return (state, dispatch) => {
      if (!state.selection.$from.parent.inlineContent) return false
      const hardBreakType = nanoSchema.nodes[nanoNodeNames.hardBreak]
      if (!hardBreakType) return false
      if (dispatch) dispatch(state.tr.replaceSelectionWith(hardBreakType.create()).scrollIntoView())
      return true
    }
  }

  private historyCommand(direction: 'undo' | 'redo'): Command {
    return () => {
      this.restoreHistory(direction)
      return true
    }
  }

  private setBlockTypeCommand(nodeName: string, attrs?: Record<string, unknown>): Command {
    const nodeType = nanoSchema.nodes[nodeName]
    return nodeType
      ? (state, dispatch, view) => {
          const current = state.selection.$from.parent
          return setBlockType(nodeType, {
            id: current.attrs.id ?? null,
            ...(attrs ?? {}),
          })(state, dispatch, view)
        }
      : () => false
  }

  private toggleMarkCommand(markName: string): Command {
    const markType = nanoSchema.marks[markName]
    return markType ? toggleMark(markType) : () => false
  }

  private toggleBlockTypeCommand(nodeName: string, attrs: Record<string, unknown> = {}): Command {
    const nodeType = nanoSchema.nodes[nodeName]
    const paragraphType = nanoSchema.nodes[nanoNodeNames.paragraph]
    if (!nodeType || !paragraphType) return () => false

    return (state, dispatch) => {
      const current = state.selection.$from.parent
      const active = current.type === nodeType && blockAttrsMatch(current.attrs, attrs)
      return active
        ? setBlockType(paragraphType, { id: current.attrs.id ?? null })(state, dispatch)
        : setBlockType(nodeType, {
            id: current.attrs.id ?? null,
            ...attrs,
          })(state, dispatch)
    }
  }

  private textblockEndCommand(options: { extend?: boolean } = {}): Command {
    return (state, dispatch) => {
      const { selection } = state
      const { $head } = selection
      if (!$head.parent.inlineContent) return false

      const end = $head.end()
      if (!options.extend && selection.empty && $head.pos === end) return false

      const anchor = options.extend ? selection.anchor : end
      if (dispatch) {
        dispatch(state.tr
          .setSelection(TextSelection.create(state.doc, anchor, end))
          .scrollIntoView())
      }
      return true
    }
  }

  private coalesceTextHistory(change: NanoDocumentChange): void {
    const now = Date.now()
    if (change.mergePath && this.lastTextMergePath === change.mergePath && now - this.lastTextMergeAt < TEXT_MERGE_MS) {
      this.options.engine.history.mergeLast({ mergeKey: `text:${change.mergePath}` })
    }
    this.lastTextMergePath = change.mergePath ?? null
    this.lastTextMergeAt = now
  }
}

function blockAttrsMatch(current: Record<string, unknown>, expected: Record<string, unknown>): boolean {
  return Object.entries(expected).every(([key, value]) => current[key] === value)
}

function transactionLabel(transaction: Transaction): string {
  const inputType = transaction.getMeta('inputType')
  return typeof inputType === 'string' ? inputType : 'nano2 edit'
}
