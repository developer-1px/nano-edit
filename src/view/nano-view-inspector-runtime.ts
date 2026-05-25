import type { Transaction } from 'prosemirror-state'
import type { NanoViewContext } from './nano-view-context'
import { createNanoInspectorIndexRuntime } from './nano-view-inspector-index'
import { createNanoInspectorMarkdownRuntime } from './nano-view-inspector-markdown'
import { createNanoInspectorNavigation } from './nano-view-inspector-navigation'

export interface NanoInspectorRuntime {
  dispatchAndReveal: (transaction: Transaction) => void
  focusActiveMarkdownSource: () => boolean
  renderIndex: () => void
  renderMarkdown: () => void
}

export function createNanoInspectorRuntime(ctx: NanoViewContext): NanoInspectorRuntime {
  const navigation = createNanoInspectorNavigation(ctx)
  const index = createNanoInspectorIndexRuntime(ctx, navigation)
  const markdown = createNanoInspectorMarkdownRuntime(ctx, navigation)

  return {
    dispatchAndReveal: navigation.dispatchAndReveal,
    focusActiveMarkdownSource: markdown.focusActiveMarkdownSource,
    renderIndex: index.renderIndex,
    renderMarkdown: markdown.renderMarkdown,
  }
}
