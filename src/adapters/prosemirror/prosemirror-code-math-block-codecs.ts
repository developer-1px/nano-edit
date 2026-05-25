import { mathStyle } from './prosemirror-atom-dom'
import {
  codeFenceIndent,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
} from './prosemirror-block-attrs'
import {
  defineNanoBlockCodec,
  type AnyNanoBlockCodec,
} from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const codeMathBlockCodecs: readonly AnyNanoBlockCodec[] = [
  defineNanoBlockCodec({
    nanoType: 'code',
    nodeName: nanoNodeNames.codeBlock,
    fromNano: (block) => nanoSchema.nodes[nanoNodeNames.codeBlock].create(
      {
        id: block.id,
        language: block.language ?? null,
        fenceIndent: codeFenceIndent(block.fenceIndent),
        fenceInfoSpacing: codeFenceInfoSpacing(block.fenceInfoSpacing),
        fenceMarker: codeFenceMarker(block.fenceMarker),
        fenceLength: codeFenceLength(block.fenceLength),
      },
      block.text ? nanoSchema.text(block.text) : null,
    ),
    toNano: (node, id) => {
      const language = typeof node.attrs.language === 'string' && node.attrs.language ? node.attrs.language : null
      return {
        id,
        type: 'code',
        text: node.textContent,
        ...(language ? { language } : {}),
        ...(codeFenceIndent(node.attrs.fenceIndent) ? { fenceIndent: codeFenceIndent(node.attrs.fenceIndent) } : {}),
        ...(codeFenceInfoSpacing(node.attrs.fenceInfoSpacing) ? { fenceInfoSpacing: codeFenceInfoSpacing(node.attrs.fenceInfoSpacing) } : {}),
        ...(codeFenceMarker(node.attrs.fenceMarker) !== '`' ? { fenceMarker: codeFenceMarker(node.attrs.fenceMarker) } : {}),
        ...(codeFenceLength(node.attrs.fenceLength) !== 3 ? { fenceLength: codeFenceLength(node.attrs.fenceLength) } : {}),
      }
    },
  }),
  defineNanoBlockCodec({
    nanoType: 'math',
    nodeName: nanoNodeNames.mathBlock,
    fromNano: (block) => nanoSchema.nodes[nanoNodeNames.mathBlock].create(
      { id: block.id, mathStyle: mathStyle(block.mathStyle) },
      block.text ? nanoSchema.text(block.text) : null,
    ),
    toNano: (node, id) => {
      const nodeMathStyle = mathStyle(node.attrs.mathStyle)
      return {
        id,
        type: 'math',
        text: node.textContent,
        ...(nodeMathStyle ? { mathStyle: nodeMathStyle } : {}),
      }
    },
  }),
]
