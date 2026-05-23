import { nanoMarkNames } from './prosemirror-nano'

export type MarkName = (typeof nanoMarkNames)[keyof typeof nanoMarkNames]

export interface MarkToolbarOption {
  label: string
  title: string
}

export interface MarkShortcut {
  name: string
  open?: string
  close?: string
  preserveSyntax?: boolean
  match?: (source: string) => MarkShortcutMatch | null
  attrs?: (match: MarkShortcutMatch, source: string) => Record<string, unknown>
}

export interface MarkShortcutMatch {
  openFrom: number
  contentFrom: number
  contentTo: number
  closeTo: number
  markFrom?: number
  markTo?: number
  attrs?: Record<string, unknown>
}

export interface MarkOption {
  id: string
  markName: MarkName
  toolbar?: MarkToolbarOption
  keyBindings?: readonly string[]
  inputTypes?: readonly string[]
  shortcuts?: readonly MarkShortcut[]
}

export type MarkToolbarEntry = MarkOption & { toolbar: MarkToolbarOption }

export interface MarkKeyBindingEntry {
  option: MarkOption
  keyBinding: string
}
