import { PluginKey } from 'prosemirror-state'

export interface SourceRevealPluginState {
  focused: boolean
}

export const unfocusedSourceRevealState: SourceRevealPluginState = { focused: false }

export const sourceRevealPluginKey = new PluginKey<SourceRevealPluginState>('nano-source-reveal')
