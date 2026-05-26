import type { EditorState } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { activeBlockSources, type ActiveBlockSource } from './nano-source-reveal-block-sources'
import {
  collectInlineMarkRanges,
  inlineSourceForMark,
} from './nano-source-reveal-inline-sources'
import { selectionTouchesInlineRange } from './nano-source-reveal-selection'
import { sourceWidgetDecoration } from './nano-source-reveal-widgets'
import type { SourceRevealPluginState } from './nano-source-reveal-state'

export function sourceRevealDecorations(
  state: EditorState,
  pluginState: SourceRevealPluginState,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): DecorationSet {
  if (!pluginState.focused) return DecorationSet.empty

  const decorations: Decoration[] = []
  for (const block of activeBlockSources(state, collapsedBlockIds)) {
    decorateBlockSourceMarker(decorations, block)
    decorateInlineMarkSources(decorations, state, block)
  }

  return decorations.length > 0 ? DecorationSet.create(state.doc, decorations) : DecorationSet.empty
}

function decorateBlockSourceMarker(decorations: Decoration[], block: ActiveBlockSource): void {
  if (block.leadingMarker) {
    decorations.push(sourceWidgetDecoration(
      block.from + 1,
      block.leadingMarker,
      'nano-block-source-marker',
      'block-leading',
      `block-leading:${block.from}:${block.leadingMarker}`,
      -1000,
    ))
  }

  if (block.trailingMarker) {
    decorations.push(sourceWidgetDecoration(
      block.to - 1,
      block.trailingMarker,
      'nano-block-source-tail-marker',
      'block-trailing',
      `block-trailing:${block.to}:${block.trailingMarker}`,
      1000,
    ))
  }
}

function decorateInlineMarkSources(
  decorations: Decoration[],
  state: EditorState,
  block: ActiveBlockSource,
): void {
  if (!block.node.isTextblock) return

  const contentFrom = block.from + 1
  const ranges = collectInlineMarkRanges(block.node)
  for (const range of ranges) {
    if (!selectionTouchesInlineRange(state, contentFrom, range.from, range.to)) continue

    const text = block.node.textBetween(range.from, range.to, '', '')
    const source = inlineSourceForMark(range.mark, text)
    if (!source) continue

    const from = contentFrom + range.from
    const to = contentFrom + range.to
    if (source.kind === 'replacement') {
      decorations.push(Decoration.inline(
        from,
        to,
        { class: 'nano-inline-source-replaced' },
        {
          nanoSourceKind: 'inline-replacement-range',
          nanoSourceMark: range.mark.type.name,
          nanoSourceToken: source.source,
        },
      ))
      decorations.push(sourceWidgetDecoration(
        from,
        source.source,
        'nano-inline-source-marker nano-inline-source-replacement',
        'inline-replacement',
        `inline-replacement:${range.mark.type.name}:${from}:${to}:${source.source}`,
        -200 + source.priority,
      ))
      continue
    }

    if (source.open) {
      decorations.push(sourceWidgetDecoration(
        from,
        source.open,
        'nano-inline-source-marker',
        'inline-open',
        `inline-open:${range.mark.type.name}:${from}:${to}:${source.open}`,
        -200 + source.priority,
      ))
    }
    if (source.close) {
      decorations.push(sourceWidgetDecoration(
        to,
        source.close,
        'nano-inline-source-marker',
        'inline-close',
        `inline-close:${range.mark.type.name}:${from}:${to}:${source.close}`,
        200 - source.priority,
      ))
    }
  }
}
