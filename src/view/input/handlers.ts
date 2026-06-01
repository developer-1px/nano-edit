import type { EditorView } from 'prosemirror-view'

export interface NanoInputHandlers {
  handleBeforeInput: (event: InputEvent) => boolean
  handleCopy: (view: EditorView, event: ClipboardEvent) => boolean
  handleEditorBlur: (view: EditorView) => boolean
  handleEditorClick: (view: EditorView, event: MouseEvent) => boolean
  handleEditorKeydown: (view: EditorView, event: KeyboardEvent) => boolean
  handleEditorMouseDown: (event: MouseEvent) => boolean
  handlePaste: (view: EditorView, event: ClipboardEvent) => boolean
  handleShortcutInput: (view: EditorView, from: number, to: number, text: string) => boolean
}
