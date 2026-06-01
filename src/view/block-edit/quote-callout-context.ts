import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  quoteMarkerDepthsOrNull,
  quoteMarkerSpacingOrNull,
  quoteMarkerSpacingValueOrNull,
  type QuoteMarkerSpacing,
} from '../../core/nano-source-metadata'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-nano'

export function quoteContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  return {
    quoteMarkerSpacing: quoteMarkerSpacingOrNull(replacement.attrs.quoteMarkerSpacing)
      ?? quoteLineMarkerSpacing(source),
    quoteMarkerDepths: quoteMarkerDepthsOrNull(replacement.attrs.quoteMarkerDepths)
      ?? quoteLineMarkerDepths(source),
  }
}

export function calloutContextAttrsForReplacement(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> {
  return {
    calloutMarkerDepths: quoteMarkerDepthsOrNull(replacement.attrs.calloutMarkerDepths)
      ?? quoteLineMarkerDepths(source),
    calloutMarkerSpacing: quoteMarkerSpacingOrNull(replacement.attrs.calloutMarkerSpacing)
      ?? quoteLineMarkerSpacing(source),
    calloutTextSpacing: quoteMarkerSpacingValueOrNull(replacement.attrs.calloutTextSpacing)
      ?? quoteMarkerSpacingValueOrNull(source.attrs.calloutTextSpacing),
  }
}

function quoteLineMarkerSpacing(node: ProseMirrorNode): QuoteMarkerSpacing[] | null {
  if (node.type.name === nanoNodeNames.callout) return quoteMarkerSpacingOrNull(node.attrs.calloutMarkerSpacing)
  return quoteMarkerSpacingOrNull(node.attrs.quoteMarkerSpacing)
}

function quoteLineMarkerDepths(node: ProseMirrorNode): number[] | null {
  if (node.type.name === nanoNodeNames.callout) return quoteMarkerDepthsOrNull(node.attrs.calloutMarkerDepths)
  return quoteMarkerDepthsOrNull(node.attrs.quoteMarkerDepths)
}
