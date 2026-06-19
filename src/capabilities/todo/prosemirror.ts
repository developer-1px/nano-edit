import type { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model'
import { Square, SquareCheck } from 'lucide'
import type { NanoBlock, NanoMark } from '../../entities/document/nano-document-model'
import { listContinuationDefaultIndent } from '../../codecs/markdown/nano-markdown-list-attrs'
import { foldIndicatorDomSpec } from '../../view/block-ui/fold-indicator'
import { lucideIcon } from '../../view/icons'
import {
  clampIndent,
  indentText,
} from '../block-indent-values'
import {
  bulletMarker,
  checkedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'
import {
  continuationIndentDataAttrs,
  decodeContinuationIndents,
  normalizeContinuationIndents,
  normalizeContinuationIndentsForText,
} from '../../adapters/prosemirror/prosemirror-continuation-indent-attrs'
import {
  blockIndentAttrs,
  indentTextAttrs,
} from '../../adapters/prosemirror/prosemirror-list-attrs'
import { prosemirrorParseDomElement } from '../../adapters/prosemirror/prosemirror-parse-dom'
import {
  textDirectionAttrs,
  textDirectionFromElement,
  textDirectionNanoAttrs,
  textDirectionNodeAttrs,
} from '../../adapters/prosemirror/prosemirror-text-direction'

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
    textDirection: { default: null },
  },
  parseDOM: [{
    tag: 'div.nano-todo',
    getAttrs: (dom) => {
      const element = prosemirrorParseDomElement(dom)
      if (!element) return false

      return {
        checked: element.dataset.checked === 'true',
        continuationIndents: decodeContinuationIndents(element.dataset.continuationIndents),
        indent: clampIndent(Number(element.dataset.indent ?? 0)),
        indentText: indentText(element.dataset.indentText),
        marker: bulletMarker(element.dataset.marker),
        checkedMarker: checkedMarker(element.dataset.checkedMarker),
        textDirection: textDirectionFromElement(element),
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
      ...textDirectionAttrs(node.attrs.textDirection),
    },
    foldIndicatorDomSpec('nano-list-fold'),
    ['span', {
      class: 'nano-todo-box',
      contenteditable: 'false',
      role: 'checkbox',
      'aria-checked': String(node.attrs.checked),
      'aria-label': 'Todo',
      tabindex: '0',
      title: node.attrs.checked ? 'Done' : 'Todo',
    },
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
    ...textDirectionNodeAttrs(block.textDirection),
  }
}

export function todoBlockFromProseMirrorNode(
  node: ProseMirrorNode,
  id: string,
  marks: NanoMark[],
): TodoBlock {
  const rawIndent = indentText(node.attrs.indentText)
  const indent = clampIndent(Number(node.attrs.indent))
  const checked = node.attrs.checked === true
  const marker = `${rawIndent ?? '  '.repeat(indent)}${bulletMarker(node.attrs.marker)} [${checked ? checkedMarker(node.attrs.checkedMarker) : ' '}]`
  const continuationIndents = normalizeContinuationIndentsForText(
    node.attrs.continuationIndents,
    node.textContent,
    listContinuationDefaultIndent(marker),
  )
  return {
    id,
    type: 'todo',
    checked,
    ...(continuationIndents ? { continuationIndents } : {}),
    indent,
    ...(rawIndent ? { indentText: rawIndent } : {}),
    ...(bulletMarker(node.attrs.marker) !== '-' ? { marker: bulletMarker(node.attrs.marker) } : {}),
    ...(node.attrs.checked === true && checkedMarker(node.attrs.checkedMarker) !== 'x' ? { checkedMarker: checkedMarker(node.attrs.checkedMarker) } : {}),
    ...textDirectionNanoAttrs(node.attrs.textDirection),
    text: node.textContent,
    marks,
  }
}
