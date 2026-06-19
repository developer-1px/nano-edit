import { setBlockType, toggleMark } from 'prosemirror-commands'
import { Bold, Heading1, Italic, List } from 'lucide'
import type { Command, EditorState, PluginView, Transaction } from 'prosemirror-state'
import { Plugin, TextSelection } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import {
  nanoMarkNames,
  nanoNodeNames,
} from '../adapters/prosemirror/prosemirror-names'
import { lucideIconElement, type IconNode } from '../view/icons'

export type Nano2MenuAction = 'bold' | 'italic' | 'heading1' | 'bulletList'

export interface Nano2MenuCommandState {
  boldActive: boolean
  bubbleVisible: boolean
  bulletListActive: boolean
  floatingVisible: boolean
  italicActive: boolean
}

export function nano2MenuCommandState(state: EditorState): Nano2MenuCommandState {
  return {
    boldActive: markActive(state, nanoMarkNames.bold),
    bubbleVisible: bubbleMenuVisible(state),
    bulletListActive: blockActive(state, nanoNodeNames.listItem, { kind: 'bullet' }),
    floatingVisible: floatingMenuVisible(state),
    italicActive: markActive(state, nanoMarkNames.italic),
  }
}

export function nano2MenuActionTransaction(state: EditorState, action: Nano2MenuAction): Transaction | null {
  const command = menuCommand(state, action)
  let transaction: Transaction | null = null
  const applied = command(state, (tr) => {
    transaction = tr.setMeta('inputType', `nano2Menu:${action}`)
  })
  return applied ? transaction : null
}

export function nano2MenuPlugin(root: HTMLElement): Plugin {
  return new Plugin({
    view: (view) => new Nano2MenuView(root, view),
  })
}

class Nano2MenuView implements PluginView {
  private readonly bubble = menuElement('nano2-bubble-menu')
  private readonly floating = menuElement('nano2-floating-menu')
  private readonly buttonCleanups: Array<() => void> = []
  private readonly root: HTMLElement

  constructor(root: HTMLElement, view: EditorView) {
    this.root = root
    this.buttonCleanups.push(
      appendMenuButton(this.bubble, view, 'bold'),
      appendMenuButton(this.bubble, view, 'italic'),
      appendMenuButton(this.floating, view, 'heading1'),
      appendMenuButton(this.floating, view, 'bulletList'),
    )
    root.append(this.bubble, this.floating)
    this.update(view)
  }

  update(view: EditorView): void {
    const state = nano2MenuCommandState(view.state)
    this.syncButtons(view.state, state)
    this.positionBubble(view, state.bubbleVisible)
    this.positionFloating(view, state.floatingVisible)
  }

  destroy(): void {
    for (const cleanup of this.buttonCleanups) cleanup()
    this.bubble.remove()
    this.floating.remove()
  }

  private syncButtons(state: EditorState, menuState: Nano2MenuCommandState): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('.nano2-menu-button')) {
      const action = menuAction(button.dataset.command)
      if (!action) continue
      button.disabled = !menuCommand(state, action)(state)
      button.dataset.active = String(actionActive(action, menuState))
    }
  }

  private positionBubble(view: EditorView, visible: boolean): void {
    this.bubble.hidden = !visible
    if (!visible) return

    const { from, to } = view.state.selection
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    this.bubble.style.left = `${Math.round((start.left + end.right) / 2)}px`
    this.bubble.style.top = `${Math.max(8, Math.round(Math.min(start.top, end.top) - 42))}px`
  }

  private positionFloating(view: EditorView, visible: boolean): void {
    this.floating.hidden = !visible
    if (!visible) return

    const coords = view.coordsAtPos(view.state.selection.from)
    this.floating.style.left = `${Math.round(coords.left)}px`
    this.floating.style.top = `${Math.round(coords.bottom + 8)}px`
  }
}

function menuElement(className: string): HTMLElement {
  const element = document.createElement('div')
  element.className = `nano2-menu ${className}`
  element.hidden = true
  element.setAttribute('role', 'toolbar')
  return element
}

function appendMenuButton(parent: HTMLElement, view: EditorView, action: Nano2MenuAction): () => void {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano2-menu-button'
  button.dataset.command = action
  button.setAttribute('aria-label', menuButtonLabel(action))
  button.title = menuButtonLabel(action)
  button.append(lucideIconElement(menuButtonIcon(action), 'nano2-menu-icon'))

  const preventBlur = (event: MouseEvent) => event.preventDefault()
  const run = () => {
    const transaction = nano2MenuActionTransaction(view.state, action)
    if (!transaction) return
    view.dispatch(transaction.scrollIntoView())
    view.focus()
  }

  button.addEventListener('mousedown', preventBlur)
  button.addEventListener('click', run)
  parent.append(button)

  return () => {
    button.removeEventListener('mousedown', preventBlur)
    button.removeEventListener('click', run)
  }
}

function menuCommand(state: EditorState, action: Nano2MenuAction): Command {
  if (action === 'bold') {
    const markType = state.schema.marks[nanoMarkNames.bold]
    return markType ? toggleMark(markType) : () => false
  }
  if (action === 'italic') {
    const markType = state.schema.marks[nanoMarkNames.italic]
    return markType ? toggleMark(markType) : () => false
  }
  if (action === 'heading1') {
    const nodeType = state.schema.nodes[nanoNodeNames.heading]
    return nodeType
      ? setBlockType(nodeType, { id: state.selection.$from.parent.attrs.id ?? null, level: 1 })
      : () => false
  }

  const nodeType = state.schema.nodes[nanoNodeNames.listItem]
  return nodeType
    ? setBlockType(nodeType, {
        id: state.selection.$from.parent.attrs.id ?? null,
        indent: 0,
        kind: 'bullet',
        marker: '-',
      })
    : () => false
}

function bubbleMenuVisible(state: EditorState): boolean {
  const { selection } = state
  return selection instanceof TextSelection && !selection.empty && selection.$from.parent.inlineContent
}

function floatingMenuVisible(state: EditorState): boolean {
  const { selection } = state
  if (!(selection instanceof TextSelection) || !selection.empty) return false
  return selection.$from.parent.type.name === nanoNodeNames.paragraph && selection.$from.parent.content.size === 0
}

function markActive(state: EditorState, markName: string): boolean {
  const markType = state.schema.marks[markName]
  if (!markType) return false
  const { from, to, empty, $from } = state.selection
  if (empty) return markType.isInSet(state.storedMarks ?? $from.marks()) !== undefined
  return state.doc.rangeHasMark(from, to, markType)
}

function blockActive(state: EditorState, nodeName: string, attrs: Record<string, unknown>): boolean {
  const current = state.selection.$from.parent
  return current.type.name === nodeName && Object.entries(attrs).every(([key, value]) => current.attrs[key] === value)
}

function actionActive(action: Nano2MenuAction, state: Nano2MenuCommandState): boolean {
  if (action === 'bold') return state.boldActive
  if (action === 'italic') return state.italicActive
  if (action === 'bulletList') return state.bulletListActive
  return false
}

function menuAction(action: unknown): Nano2MenuAction | null {
  return action === 'bold' || action === 'italic' || action === 'heading1' || action === 'bulletList'
    ? action
    : null
}

function menuButtonLabel(action: Nano2MenuAction): string {
  if (action === 'bold') return 'Bold'
  if (action === 'italic') return 'Italic'
  if (action === 'heading1') return 'Heading 1'
  return 'Bullet list'
}

function menuButtonIcon(action: Nano2MenuAction): IconNode {
  if (action === 'bold') return Bold
  if (action === 'italic') return Italic
  if (action === 'heading1') return Heading1
  return List
}
