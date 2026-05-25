import type { BlockOption } from '../assembly/capability'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'
import {
  convertBlockToParagraphAtStart,
  exitEmptyThen,
  footnoteTemplate,
  footnoteName,
  noteRefTemplate,
  noteRefNodeForBlockTemplate,
  quoteMarkerSpacingValue,
  splitBlockToParagraph,
  tagRefTemplate,
  tagRefNodeForBlockTemplate,
} from './nano-block-option-internals'

export const referenceBlockOptions: readonly BlockOption[] = [
  {
    id: 'footnote',
    label: 'Fn',
    title: 'Footnote',
    markdownTrigger: '[^1]:',
    template: { type: 'footnote', name: '1' },
    shortcuts: [{
      name: 'footnote',
      pattern: /^\[\^([^\]\s\r\n]+)\]: $/,
      template: (match) => ({ type: 'footnote', name: footnoteName(match[1] ?? '') || '1' }),
    }],
    enterShortcuts: [{
      name: 'footnote-line',
      pattern: /^\[\^([^\]\s\r\n]+)\]:(?:\s?(.*))?$/,
      template: (match) => footnoteTemplate(match[0] ?? ''),
    }],
    matchesTemplate: (template) => template.type === 'footnote',
    matches: (node) => node.type.name === nanoNodeNames.footnote,
    nodeType: () => nanoSchema.nodes[nanoNodeNames.footnote],
    attrs: (template, id) => ({
      id,
      name: template.type === 'footnote' ? footnoteName(template.name) || '1' : '1',
      footnoteTextSpacing: template.type === 'footnote' ? quoteMarkerSpacingValue(template.footnoteTextSpacing) : null,
    }),
    behavior: {
      enter: exitEmptyThen(splitBlockToParagraph),
      backspaceAtStart: convertBlockToParagraphAtStart,
    },
  },
  {
    id: 'note-ref',
    label: 'Note',
    title: 'Note Reference',
    markdownTrigger: '[[ ]]',
    enterShortcuts: [{
      name: 'note-ref-line',
      pattern: /^\[\[[^\]\n\r]+\]\]$/,
      template: (match) => noteRefTemplate(match[0] ?? ''),
    }],
    matchesTemplate: (template) => template.type === 'note_ref',
    matches: (node) => node.type.name === nanoNodeNames.noteRef,
    nodeType: () => nanoSchema.nodes[nanoNodeNames.noteRef],
    attrs: (template, id) => ({
      id,
      target: template.type === 'note_ref' ? template.target : '',
      alias: template.type === 'note_ref' ? template.alias ?? '' : '',
    }),
    canSetTextblockMarkup: false,
    insertedNode: noteRefNodeForBlockTemplate,
    replacementNode: noteRefNodeForBlockTemplate,
  },
  {
    id: 'tag-ref',
    label: 'Tag',
    title: 'Tag Reference',
    markdownTrigger: '#tag',
    enterShortcuts: [{
      name: 'tag-ref-line',
      pattern: /^#(?:[\p{L}\p{N}_][\p{L}\p{N}_/-]*|[\p{L}\p{N}_][\p{L}\p{N}_/ -]*#)$/u,
      template: (match) => tagRefTemplate(match[0] ?? ''),
    }],
    matchesTemplate: (template) => template.type === 'tag_ref',
    matches: (node) => node.type.name === nanoNodeNames.tagRef,
    nodeType: () => nanoSchema.nodes[nanoNodeNames.tagRef],
    attrs: (template, id) => ({
      id,
      name: template.type === 'tag_ref' ? template.name : '',
    }),
    canSetTextblockMarkup: false,
    insertedNode: tagRefNodeForBlockTemplate,
    replacementNode: tagRefNodeForBlockTemplate,
  },
]
