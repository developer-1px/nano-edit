import type { NodeSpec } from 'prosemirror-model'
import { firstNonBlankStringValue } from '../../entities/block/schema/nano-block-schema-refinements'
import { footnoteName } from '../../entities/reference/nano-footnote'
import {
  decodeFootnoteContinuationIndents,
  footnoteContinuationIndentDataAttrs,
} from './prosemirror-continuation-indent-attrs'
import { prosemirrorParseDomElement } from './prosemirror-parse-dom'
import { textSpacingValue } from './prosemirror-quote-marker-attrs'
import { sourceTokenAttrs } from './prosemirror-source-token'

export const footnoteNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  defining: true,
  attrs: {
    id: { default: null },
    footnoteContinuationIndents: { default: null },
    footnoteTextSpacing: { default: null },
    name: { default: '1' },
  },
  parseDOM: [{
    tag: 'div.nano-footnote',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      const marker = element.querySelector<HTMLElement>('.nano-footnote-marker')
      return {
        footnoteContinuationIndents: decodeFootnoteContinuationIndents(element.dataset.footnoteContinuationIndents),
        footnoteTextSpacing: textSpacingValue(element.dataset.footnoteTextSpacing),
        name: firstNonBlankStringValue(
          footnoteName(element.dataset.name ?? ''),
          footnoteName(marker?.dataset.label ?? ''),
          footnoteName(marker?.textContent ?? ''),
          '1',
        ),
      }
    },
  }],
  toDOM: (node) => {
    const name = footnoteName(String(node.attrs.name ?? '1')) || '1'
    return [
      'div',
      {
        class: 'nano-block nano-footnote',
        'data-id': node.attrs.id,
        'data-name': name,
        ...footnoteContinuationIndentDataAttrs(node.attrs.footnoteContinuationIndents),
        ...(textSpacingValue(node.attrs.footnoteTextSpacing) === 'none' ? { 'data-footnote-text-spacing': 'none' } : {}),
      },
      ['span', sourceTokenAttrs('nano-footnote-marker', {
        contenteditable: 'false',
        'data-label': name,
      }), name],
      ['span', { class: 'nano-block-content' }, 0],
    ]
  },
}
