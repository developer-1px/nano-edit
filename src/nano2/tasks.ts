import { Plugin, type EditorState, type Transaction } from 'prosemirror-state'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView } from 'prosemirror-view'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'

export function nano2TaskPlugin(): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        click: (view, event) => {
          const position = todoPositionFromTarget(view, event.target)
          if (position === null) return false

          event.preventDefault()
          return toggleTodoAt(view, position)
        },
        keydown: (view, event) => {
          if (event.key !== ' ' && event.key !== 'Enter') return false

          const position = todoPositionFromTarget(view, event.target)
          if (position === null) return false

          event.preventDefault()
          return toggleTodoAt(view, position)
        },
      },
    },
  })
}

export function nano2ToggleTodoTransaction(state: EditorState, position: number): Transaction | null {
  const node = state.doc.nodeAt(position)
  if (!node || node.type.name !== nanoNodeNames.todo) return null

  return state.tr.setNodeMarkup(position, node.type, {
    ...node.attrs,
    checked: node.attrs.checked !== true,
  })
}

function todoPositionFromTarget(view: EditorView, target: EventTarget | null): number | null {
  const element = target instanceof Element ? target : null
  const checkbox = element?.closest('.nano-todo-box')
  const block = checkbox?.closest<HTMLElement>('.nano-todo[data-id]')
  const id = block?.dataset.id
  if (!id) return null

  let match: number | null = null
  view.state.doc.descendants((node: ProseMirrorNode, position: number) => {
    if (match !== null) return false
    if (node.type.name === nanoNodeNames.todo && node.attrs.id === id) {
      match = position
      return false
    }
    return true
  })

  return match
}

function toggleTodoAt(view: EditorView, position: number): boolean {
  const transaction = nano2ToggleTodoTransaction(view.state, position)
  if (!transaction) return false

  view.dispatch(transaction.scrollIntoView())
  view.focus()
  return true
}
