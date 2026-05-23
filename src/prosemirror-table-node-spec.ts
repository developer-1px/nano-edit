import type { NodeSpec } from 'prosemirror-model'
import {
  tableAttrsFromElement,
  tableDomSpec,
} from './prosemirror-table'

export const tableNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: {
    id: { default: null },
    rows: { default: [] },
    align: { default: [] },
    leadingPipe: { default: true },
    leadingPipes: { default: [] },
    separatorCells: { default: [] },
    trailingPipe: { default: true },
    trailingPipes: { default: [] },
  },
  parseDOM: [{
    tag: 'figure.nano-table',
    getAttrs: (dom) => tableAttrsFromElement(dom as HTMLElement),
  }, {
    tag: 'table',
    getAttrs: (dom) => tableAttrsFromElement(dom as HTMLElement),
  }],
  toDOM: (node) => tableDomSpec(
    node.attrs.id,
    node.attrs.rows,
    node.attrs.align,
    node.attrs.separatorCells,
    node.attrs.leadingPipe,
    node.attrs.trailingPipe,
    node.attrs.leadingPipes,
    node.attrs.trailingPipes,
  ),
}
