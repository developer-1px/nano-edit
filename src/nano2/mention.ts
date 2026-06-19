import type { EditorState, PluginView } from 'prosemirror-state'
import { Plugin, TextSelection } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import {
  createAutocompleteSurface,
  visibleAutocompleteOptions,
  type AutocompleteOption,
  type AutocompleteSurface,
} from '../autocomplete'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { nano2InsertMentionTransaction } from './mentions'

interface Nano2MentionOption extends AutocompleteOption {
  insertText: string
}

interface Nano2MentionContext {
  from: number
  query: string
  to: number
}

const mentionOptions: readonly Nano2MentionOption[] = [
  { id: 'mina', title: 'Mina', hint: '@Mina', insertText: '@Mina', keywords: ['reviewer'] },
  { id: 'jules', title: 'Jules', hint: '@Jules', insertText: '@Jules', keywords: ['design'] },
  { id: 'avery', title: 'Avery', hint: '@Avery', insertText: '@Avery', keywords: ['ops'] },
]

export class Nano2MentionRuntime {
  private readonly surface: AutocompleteSurface<Nano2MentionContext, Nano2MentionOption>
  private readonly pluginInstance: Plugin
  private view: EditorView | null = null

  constructor(root: HTMLElement) {
    this.surface = createAutocompleteSurface<Nano2MentionOption, Nano2MentionContext>({
      ariaLabel: 'Mention suggestion',
      classes: {
        empty: 'nano2-mention-empty',
        hint: 'nano2-mention-hint',
        input: 'nano2-mention-input',
        list: 'nano2-mention-list',
        option: 'nano2-mention-option',
        root: 'nano2-mention-suggestion',
        title: 'nano2-mention-title',
      },
      emptyText: 'No match',
      options: (_context, query) => visibleAutocompleteOptions(mentionOptions, query),
      placeholder: '@',
      position: (element, context) => this.position(element, context),
      run: (option, context) => this.insert(option, context),
    })
    this.surface.input.addEventListener('keydown', this.handleSurfaceKeydown)
    root.append(this.surface.root)

    this.pluginInstance = new Plugin({
      props: {
        handleKeyDown: (view, event) => {
          if (event.key === 'Backspace') return this.deleteAdjacentMention(view, 'backward')
          if (event.key === 'Delete') return this.deleteAdjacentMention(view, 'forward')
          return false
        },
        handleTextInput: (view, _from, _to, text) => {
          if (text.includes('@')) requestAnimationFrame(() => this.openAtSelection(view))
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
        const context = mentionContextFromState(nextView.state)
        if (context && context.query.length === 0) this.surface.open(context, context.query)
        else if (!context) this.surface.close()
      },
      destroy: () => {
        if (this.view === view) this.view = null
      },
    }
  }

  private openAtSelection(view: EditorView): void {
    const context = mentionContextFromState(view.state)
    if (!context) return
    this.surface.open(context, context.query)
  }

  private insert(option: Nano2MentionOption, context: Nano2MentionContext): void {
    const view = this.view
    if (!view) return

    const transaction = nano2InsertMentionTransaction(view.state, {
      id: option.id,
      label: option.title,
    }, {
      from: context.from,
      to: context.to,
    })
    if (!transaction) return

    view.dispatch(transaction.scrollIntoView())
    view.focus()
  }

  private deleteAdjacentMention(view: EditorView, direction: 'backward' | 'forward'): boolean {
    const range = mentionRangeAtSelection(view.state, direction)
    if (!range) return false

    view.dispatch(view.state.tr.delete(range.from, range.to).scrollIntoView())
    return true
  }

  private position(element: HTMLElement, context: Nano2MentionContext): void {
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

interface MentionRange {
  from: number
  to: number
}

function mentionRangeAtSelection(state: EditorState, direction: 'backward' | 'forward'): MentionRange | null {
  const selection = state.selection
  if (!(selection instanceof TextSelection) || !selection.empty) return null

  const mentionType = state.schema.nodes[nanoNodeNames.mention]
  const { $from } = selection
  if (!mentionType || !$from.parent.inlineContent) return null

  const cursor = $from.pos
  let range: MentionRange | null = null
  $from.parent.forEach((node, offset) => {
    if (range || node.type !== mentionType) return

    const from = $from.start() + offset
    const to = from + node.nodeSize
    if (direction === 'backward' && from < cursor && cursor <= to) {
      range = { from, to }
    }
    if (direction === 'forward' && from <= cursor && cursor < to) {
      range = { from, to }
    }
  })
  return range
}

function mentionContextFromState(state: EditorState): Nano2MentionContext | null {
  const selection = state.selection
  if (!(selection instanceof TextSelection) || !selection.empty) return null

  const { $from } = selection
  if (!$from.parent.inlineContent) return null

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
  const match = /(^|\s)@([^\s@]*)$/.exec(textBefore)
  if (!match) return null

  const query = match[2] ?? ''
  return {
    from: $from.pos - query.length - 1,
    query,
    to: $from.pos,
  }
}
