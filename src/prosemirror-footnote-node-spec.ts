import type { NodeSpec } from 'prosemirror-model'
import { footnoteName } from './nano-footnote'
import {
  decodeFootnoteContinuationIndents,
  footnoteContinuationIndentDataAttrs,
  textSpacingValue,
} from './prosemirror-block-attrs'
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
      const element = dom as HTMLElement
      return {
        footnoteContinuationIndents: decodeFootnoteContinuationIndents(element.dataset.footnoteContinuationIndents),
        footnoteTextSpacing: textSpacingValue(element.dataset.footnoteTextSpacing),
        name: footnoteName(element.dataset.name ?? '1') || '1',
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
      }), `[^${name}]:`],
      ['span', { class: 'nano-block-content' }, 0],
    ]
  },
}
