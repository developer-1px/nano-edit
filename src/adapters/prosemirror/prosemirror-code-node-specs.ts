import type { NodeSpec } from 'prosemirror-model'
import { mathStyle } from './prosemirror-atom-dom'
import {
  codeFenceCloseToken,
  codeFenceIndent,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
  codeFenceOpenToken,
} from './prosemirror-block-attrs'
import { nanoNodeNames } from './prosemirror-names'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'

export const nanoCodeNodeSpecs: Record<string, NodeSpec> = {
  [nanoNodeNames.codeBlock]: {
    content: 'text*',
    group: 'block',
    code: true,
    marks: '',
    attrs: {
      id: { default: null },
      language: { default: null },
      fenceIndent: { default: '' },
      fenceInfoSpacing: { default: '' },
      fenceMarker: { default: '`' },
      fenceLength: { default: 3 },
    },
    parseDOM: [{
      tag: 'pre.nano-code',
      preserveWhitespace: 'full',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        return {
          fenceIndent: codeFenceIndent(element.dataset.fenceIndent),
          fenceInfoSpacing: codeFenceInfoSpacing(element.dataset.fenceInfoSpacing),
          fenceMarker: codeFenceMarker(element.dataset.fenceMarker),
          fenceLength: codeFenceLength(element.dataset.fenceLength),
        }
      },
    }],
    toDOM: (node) => [
      'pre',
      {
        class: 'nano-block nano-code',
        'data-id': node.attrs.id,
        ...(codeFenceIndent(node.attrs.fenceIndent) ? { 'data-fence-indent': codeFenceIndent(node.attrs.fenceIndent) } : {}),
        ...(codeFenceInfoSpacing(node.attrs.fenceInfoSpacing) ? { 'data-fence-info-spacing': codeFenceInfoSpacing(node.attrs.fenceInfoSpacing) } : {}),
        'data-fence-marker': codeFenceMarker(node.attrs.fenceMarker),
        'data-fence-length': String(codeFenceLength(node.attrs.fenceLength)),
      },
      ['span', hiddenSourceTokenAttrs('nano-code-fence', {
        'data-fence-role': 'open',
        ...(node.attrs.language ? { 'data-label': String(node.attrs.language) } : {}),
      }), codeFenceOpenToken(
        node.attrs.language,
        node.attrs.fenceMarker,
        node.attrs.fenceLength,
        node.attrs.fenceIndent,
        node.attrs.fenceInfoSpacing,
      )],
      ['code', { 'data-language': node.attrs.language ?? '' }, 0],
      ['span', hiddenSourceTokenAttrs('nano-code-fence', {
        'data-fence-role': 'close',
      }), codeFenceCloseToken(
        node.attrs.fenceMarker,
        node.attrs.fenceLength,
        node.attrs.fenceIndent,
      )],
    ],
  },
  [nanoNodeNames.mathBlock]: {
    content: 'text*',
    group: 'block',
    code: true,
    marks: '',
    defining: true,
    attrs: { id: { default: null }, mathStyle: { default: '' } },
    parseDOM: [{
      tag: 'pre.nano-math-block',
      preserveWhitespace: 'full',
      getAttrs: (dom) => ({ mathStyle: mathStyle((dom as HTMLElement).dataset.mathStyle) }),
    }],
    toDOM: (node) => [
      'pre',
      {
        class: 'nano-block nano-math-block',
        'data-id': node.attrs.id,
        ...(mathStyle(node.attrs.mathStyle) ? { 'data-math-style': mathStyle(node.attrs.mathStyle) } : {}),
      },
      ['span', hiddenSourceTokenAttrs('nano-math-fence', {
        'data-fence-role': 'open',
      }), '$$'],
      ['code', { class: 'nano-math-content' }, 0],
      ['span', hiddenSourceTokenAttrs('nano-math-fence', {
        'data-fence-role': 'close',
      }), '$$'],
    ],
  },
}
