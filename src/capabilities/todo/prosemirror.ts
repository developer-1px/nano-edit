import type { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model'
import { Square, SquareCheck } from 'lucide'
import type { NanoBlock, NanoMark } from '../../nano-core'
import { foldIndicatorDomSpec } from '../../nano-fold-indicator'
import { lucideIcon } from '../../nano-icons'
import {
  bulletMarker,
  checkedMarker,
  clampIndent,
  indentText,
} from '../prosemirror-block-behavior'
import {
  continuationIndentDataAttrs,
  decodeContinuationIndents,
  normalizeContinuationIndents,
} from './prosemirror-continuation-indents'

type TodoBlock = Extract<NanoBlock, { type: 'todo' }>

export const todoNodeSpec: NodeSpec = {
  content: 'inline*',
  group: 'block',
  attrs: {
    id: { default: null },
    checked: { default: false },
    continuationIndents: { default: null },
    indent: { default: 0 },
    indentText: { default: null },
    marker: { default: '-' },
    checkedMarker: { default: 'x' },
  },
  parseDOM: [{
    tag: 'div.nano-todo',
    getAttrs: (dom) => {
      const element = dom as HTMLElement
      return {
        checked: element.dataset.checked === 'true',
        continuationIndents: decodeContinuationIndents(element.dataset.continuationIndents),
        indent: clampIndent(Number(element.dataset.indent ?? 0)),
        indentText: indentText(element.dataset.indentText),
        marker: bulletMarker(element.dataset.marker),
        checkedMarker: checkedMarker(element.dataset.checkedMarker),
      }
    },
  }],
  toDOM: (node) => [
    'div',
    {
      class: 'nano-block nano-todo',
      'data-id': node.attrs.id,
      'data-checked': String(node.attrs.checked),
      'data-marker': bulletMarker(node.attrs.marker),
      'data-checked-marker': checkedMarker(node.attrs.checkedMarker),
      ...continuationIndentDataAttrs(node.attrs.continuationIndents),
      ...blockIndentAttrs(node.attrs.indent),
      ...indentTextAttrs(node.attrs.indentText),
    },
    foldIndicatorDomSpec('nano-list-fold'),
    ['span', { class: 'nano-todo-box', contenteditable: 'false' },
      lucideIcon(node.attrs.checked ? SquareCheck : Square, 'nano-todo-icon'),
    ],
    ['span', { class: 'nano-block-content' }, 0],
  ],
}

export function todoNodeAttrsFromBlock(block: TodoBlock): Record<string, unknown> {
  return {
    id: block.id,
    checked: block.checked,
    continuationIndents: normalizeContinuationIndents(block.continuationIndents),
    indent: block.indent ?? 0,
    indentText: indentText(block.indentText),
    marker: bulletMarker(block.marker),
    checkedMarker: checkedMarker(block.checkedMarker),
  }
}

export function todoBlockFromProseMirrorNode(
  node: ProseMirrorNode,
  id: string,
  marks: NanoMark[],
): TodoBlock {
  const rawIndent = indentText(node.attrs.indentText)
  const continuationIndents = normalizeContinuationIndents(node.attrs.continuationIndents)
  return {
    id,
    type: 'todo',
    checked: node.attrs.checked === true,
    ...(continuationIndents ? { continuationIndents } : {}),
    indent: clampIndent(Number(node.attrs.indent)),
    ...(rawIndent ? { indentText: rawIndent } : {}),
    ...(bulletMarker(node.attrs.marker) !== '-' ? { marker: bulletMarker(node.attrs.marker) } : {}),
    ...(node.attrs.checked === true && checkedMarker(node.attrs.checkedMarker) !== 'x' ? { checkedMarker: checkedMarker(node.attrs.checkedMarker) } : {}),
    text: node.textContent,
    marks,
  }
}

function blockIndentAttrs(indent: unknown): Record<string, string> {
  const value = clampIndent(typeof indent === 'number' ? indent : Number(indent))
  return {
    'data-indent': String(value),
    style: `--nano-indent: ${value};`,
  }
}

function indentTextAttrs(indent: unknown): Record<string, string> {
  const value = indentText(indent)
  return value ? { 'data-indent-text': value } : {}
}
