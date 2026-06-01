import type { Transaction } from 'prosemirror-state'
import type { NanoViewContext } from '../runtime/context'
import { createNanoInspectorIndexRuntime } from './index-panel'
import { createNanoInspectorMarkdownRuntime } from './markdown-panel'
import { createNanoInspectorNavigation } from './navigation'

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
