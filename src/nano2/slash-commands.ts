import { Plugin, TextSelection, type EditorState, type PluginView, type Transaction } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import {
  createAutocompleteSurface,
  visibleAutocompleteOptions,
  type AutocompleteOption,
  type AutocompleteSurface,
} from '../autocomplete/index'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'

export type Nano2SlashCommandAction = 'heading1' | 'bulletList' | 'quote' | 'codeBlock'

interface Nano2SlashCommandOption extends AutocompleteOption {
  action: Nano2SlashCommandAction
}

interface Nano2SlashCommandContext {
  from: number
  query: string
  to: number
}

const slashCommandOptions: readonly Nano2SlashCommandOption[] = [
  { id: 'heading1', title: 'Heading 1', hint: '/heading', action: 'heading1', keywords: ['title', 'h1'] },
  { id: 'bullet-list', title: 'Bullet list', hint: '/bullet', action: 'bulletList', keywords: ['list', 'unordered'] },
  { id: 'quote', title: 'Quote', hint: '/quote', action: 'quote', keywords: ['blockquote'] },
  { id: 'code-block', title: 'Code block', hint: '/code', action: 'codeBlock', keywords: ['pre', 'fence'] },
]

export class Nano2SlashCommandRuntime {
  private readonly surface: AutocompleteSurface<Nano2SlashCommandContext, Nano2SlashCommandOption>
  private readonly pluginInstance: Plugin
  private view: EditorView | null = null

  constructor(root: HTMLElement) {
    this.surface = createAutocompleteSurface<Nano2SlashCommandOption, Nano2SlashCommandContext>({
      ariaLabel: 'Slash command',
      classes: {
        empty: 'nano2-slash-empty',
        hint: 'nano2-slash-hint',
        input: 'nano2-slash-input',
        list: 'nano2-slash-list',
        option: 'nano2-slash-option',
        root: 'nano2-slash-command',
        title: 'nano2-slash-title',
      },
      emptyText: 'No command',
      options: (_context, query) => visibleAutocompleteOptions(slashCommandOptions, query),
      placeholder: '/',
      position: (element, context) => this.position(element, context),
      run: (option, context) => this.run(option, context),
    })
    this.surface.input.addEventListener('keydown', this.handleSurfaceKeydown)
    root.append(this.surface.root)

    this.pluginInstance = new Plugin({
      props: {
        handleTextInput: (view, _from, _to, text) => {
          if (text.includes('/')) requestAnimationFrame(() => this.openAtSelection(view))
          return false
        },
      },
      view: (view) => this.bindView(view),
    })
  }

  destroy(): void {
    this.surface.input.removeEventListener('keydown', this.handleSurfaceKeydown)
    this.surface.destroy()
    this.view = null
  }

  plugin(): Plugin {
    return this.pluginInstance
  }

  private bindView(view: EditorView): PluginView {
    this.view = view
    return {
      update: (nextView, previousState) => {
        if (nextView.state.doc.eq(previousState.doc) && nextView.state.selection.eq(previousState.selection)) return
        if (document.activeElement === this.surface.input) return
        const context = nano2SlashCommandContextFromState(nextView.state)
        if (context && context.query.length === 0) this.surface.open(context, context.query)
        else if (!context) this.surface.close()
      },
      destroy: () => {
        if (this.view === view) this.view = null
      },
    }
  }

  private openAtSelection(view: EditorView): void {
    const context = nano2SlashCommandContextFromState(view.state)
    if (!context) return
    this.surface.open(context, context.query)
  }

  private run(option: Nano2SlashCommandOption, context: Nano2SlashCommandContext): void {
    const view = this.view
    if (!view) return

    const transaction = nano2SlashCommandTransaction(view.state, option.action, {
      from: context.from,
      to: context.to,
    })
    if (!transaction) return

    view.dispatch(transaction.scrollIntoView())
    view.focus()
  }

  private position(element: HTMLElement, context: Nano2SlashCommandContext): void {
    const view = this.view
    if (!view) return

    const coords = view.coordsAtPos(context.to)
    element.style.left = `${Math.round(coords.left)}px`
    element.style.top = `${Math.round(coords.bottom + 6)}px`
  }

  private handleSurfaceKeydown = (event: KeyboardEvent): void => {
    if (!this.surface.context()) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.surface.move(1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.surface.move(-1)
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      this.surface.runSelected()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      this.surface.close()
      this.view?.focus()
    }
  }
}

export function nano2SlashCommandTransaction(
  state: EditorState,
  action: Nano2SlashCommandAction,
  range: { from: number, to: number } | null = nano2SlashCommandContextFromState(state),
): Transaction | null {
  if (!range) return null

  const selection = state.selection
  if (!(selection instanceof TextSelection)) return null

  const $from = selection.$from
  if (!$from.parent.inlineContent) return null

  const nodeName = slashCommandNodeName(action)
  const nodeType = state.schema.nodes[nodeName]
  if (!nodeType) return null

  const blockPosition = $from.before()
  const current = $from.parent
  const tr = state.tr
    .delete(range.from, range.to)
    .setNodeMarkup(blockPosition, nodeType, slashCommandAttrs(action, current.attrs))
    .setMeta('inputType', `nano2SlashCommand:${action}`)

  return tr.setSelection(TextSelection.create(tr.doc, blockPosition + 1))
}

export function nano2SlashCommandContextFromState(state: EditorState): Nano2SlashCommandContext | null {
  const selection = state.selection
  if (!(selection instanceof TextSelection) || !selection.empty) return null

  const { $from } = selection
  if (!$from.parent.inlineContent) return null

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
  const match = /^\/([\w -]*)$/.exec(textBefore)
  if (!match) return null

  const query = match[1] ?? ''
  return {
    from: $from.pos - query.length - 1,
    query,
    to: $from.pos,
  }
}

function slashCommandNodeName(action: Nano2SlashCommandAction): string {
  if (action === 'heading1') return nanoNodeNames.heading
  if (action === 'bulletList') return nanoNodeNames.listItem
  if (action === 'quote') return nanoNodeNames.quote
  return nanoNodeNames.codeBlock
}

function slashCommandAttrs(action: Nano2SlashCommandAction, current: Record<string, unknown>): Record<string, unknown> {
  if (action === 'heading1') {
    return { id: current.id ?? null, level: 1 }
  }
  if (action === 'bulletList') {
    return { id: current.id ?? null, indent: 0, kind: 'bullet', marker: '-' }
  }
  if (action === 'codeBlock') {
    return { id: current.id ?? null, fenceLength: 3, fenceMarker: '`' }
  }
  return { id: current.id ?? null }
}
