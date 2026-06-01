import type { NodeSpec } from 'prosemirror-model'
import {
  blockIndentAttrs,
  bulletMarker,
  clampIndent,
  continuationIndentDataAttrs,
  decodeContinuationIndents,
  indentText,
  indentTextAttrs,
  orderedMarker,
  orderedStart,
  orderedStartText,
  orderedStartTextAttrs,
} from './prosemirror-block-attrs'
import { foldIndicatorDomSpec } from '../../view/block-ui/fold-indicator'
import { sourceTokenAttrs } from './prosemirror-source-token'

export const listItemNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: {
    id: { default: null },
    kind: { default: 'bullet' },
    continuationIndents: { default: null },
    indent: { default: 0 },
    indentText: { default: null },
    marker: { default: '-' },
    orderedMarker: { default: '.' },
    orderedStartText: { default: null },
    start: { default: null },
  },
  parseDOM: [{
    tag: 'div.nano-list-item',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
      return {
        kind: element.classList.contains('nano-list-ordered') ? 'ordered' : 'bullet',
        continuationIndents: decodeContinuationIndents(element.dataset.continuationIndents),
        indent: clampIndent(Number(element.dataset.indent ?? 0)),
        indentText: indentText(element.dataset.indentText),
        marker: bulletMarker(element.dataset.marker),
        orderedMarker: orderedMarker(element.dataset.orderedMarker),
        orderedStartText: orderedStartText(element.dataset.orderedStartText),
        start: orderedStart(element.dataset.start),
      }
    },
  }],
  toDOM: (node) => [
    'div',
    {
      class: `nano-block nano-list-item nano-list-${node.attrs.kind === 'ordered' ? 'ordered' : 'bullet'}`,
      'data-id': node.attrs.id,
      'data-marker': bulletMarker(node.attrs.marker),
      'data-ordered-marker': orderedMarker(node.attrs.orderedMarker),
      ...continuationIndentDataAttrs(node.attrs.continuationIndents),
      ...orderedStartTextAttrs(node.attrs.orderedStartText),
      ...(node.attrs.start ? { 'data-start': String(node.attrs.start) } : {}),
      ...blockIndentAttrs(node.attrs.indent),
      ...indentTextAttrs(node.attrs.indentText),
    },
    foldIndicatorDomSpec('nano-list-fold'),
    ['span', sourceTokenAttrs('nano-list-marker', {
      contenteditable: 'false',
      'data-marker': bulletMarker(node.attrs.marker),
      'data-ordered-marker': orderedMarker(node.attrs.orderedMarker),
    })],
    ['span', { class: 'nano-block-content' }, 0],
  ],
}
