import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import {
  isHeadingNode,
  isListLikeNode,
} from '../../blocks/nano-block-structure'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-nano'
import {
  codeBlockContextAttrsForReplacement,
  headingContextAttrsForReplacement,
} from './heading-code-context'
import { listContextAttrsForReplacement } from './list-context'
import {
  calloutContextAttrsForReplacement,
  quoteContextAttrsForReplacement,
} from './quote-callout-context'

export function blockChangeReplacementWithContext(
  source: ProseMirrorNode,
  replacement: Fragment | ProseMirrorNode | null,
): Fragment | ProseMirrorNode | null {
  if (!replacement || replacement instanceof Fragment) return replacement
  const attrs = blockReplacementContextAttrs(source, replacement)
  return attrs ? replacement.type.create({ ...replacement.attrs, ...attrs }, replacement.content, replacement.marks) : replacement
}

function blockReplacementContextAttrs(
  source: ProseMirrorNode,
  replacement: ProseMirrorNode,
): Record<string, unknown> | null {
  if (isHeadingNode(source) && isHeadingNode(replacement)) {
    return headingContextAttrsForReplacement(source, replacement)
  }
  if (source.type.name === nanoNodeNames.codeBlock && replacement.type.name === nanoNodeNames.codeBlock) {
    return codeBlockContextAttrsForReplacement(source, replacement)
  }
  if ((source.type.name === nanoNodeNames.quote || source.type.name === nanoNodeNames.callout) && replacement.type.name === nanoNodeNames.quote) {
    return quoteContextAttrsForReplacement(source, replacement)
  }
  if ((source.type.name === nanoNodeNames.quote || source.type.name === nanoNodeNames.callout) && replacement.type.name === nanoNodeNames.callout) {
    return calloutContextAttrsForReplacement(source, replacement)
  }
  return isListLikeNode(source) && isListLikeNode(replacement)
    ? listContextAttrsForReplacement(source, replacement)
    : null
}
