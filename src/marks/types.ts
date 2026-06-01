import { nanoMarkNames } from '../adapters/prosemirror/prosemirror-nano'

export type MarkName = (typeof nanoMarkNames)[keyof typeof nanoMarkNames]

export interface MarkCommandDisplay {
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
  command?: MarkCommandDisplay
  keyBindings?: readonly string[]
  inputTypes?: readonly string[]
  shortcuts?: readonly MarkShortcut[]
}

export type MarkCommandEntry = MarkOption & { command: MarkCommandDisplay }

export interface MarkKeyBindingEntry {
  option: MarkOption
  keyBinding: string
}
