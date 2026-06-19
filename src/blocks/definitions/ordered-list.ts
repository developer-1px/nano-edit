import type { BlockOption } from '../../assembly/capability'
import {
  blockIndent,
  clampIndent,
  indentText,
} from '../../capabilities/block-indent-values'
import {
  markdownIndentLevel,
  markdownIndentText,
  markdownOrderedStart,
  nextOrderedStartAttrs,
  orderedStartAttrs,
  orderedStartText,
} from '../../codecs/markdown/nano-markdown-list-attrs'
import { orderedMarker } from '../../codecs/markdown/nano-markdown-marker-attrs'
import {
  outdentEmptyListBlockThen,
  outdentListBlockAtStartThenParagraph,
} from '../../capabilities/block-behavior-list'
import { splitBlockWithNextAttrs } from '../../capabilities/block-behavior-split'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'

export const orderedListBlockOption = {
  id: 'ordered',
  label: '1.',
  title: 'Numbered List',
  markdownTrigger: '1.',
  template: { type: 'list_item', kind: 'ordered' },
  keyBindings: [{ key: 'Shift-Mod-7' }],
  shortcuts: [{
    name: 'ordered-list',
    pattern: /^([ \t]*)(\d+)([.)]) $/,
    template: (match) => ({
      type: 'list_item',
      kind: 'ordered',
      indent: markdownIndentLevel(match[1] ?? ''),
      indentText: markdownIndentText(match[1]),
      ...orderedStartAttrs(match[2]),
      orderedMarker: orderedMarker(match[3]),
    }),
  }],
  enterShortcuts: [{
    name: 'ordered-line',
    pattern: /^([ \t]*)(\d+)([.)])(?:\s+(.*))?$/,
    template: (match) => ({
      type: 'list_item',
      kind: 'ordered',
      indent: markdownIndentLevel(match[1] ?? ''),
      indentText: markdownIndentText(match[1]),
      ...orderedStartAttrs(match[2]),
      orderedMarker: orderedMarker(match[3]),
      text: match[4] ?? '',
    }),
  }],
  matchesTemplate: (template) => template.type === 'list_item' && template.kind === 'ordered',
  matches: (node) => node.type.name === nanoNodeNames.listItem && node.attrs.kind === 'ordered',
  nodeType: () => nanoSchema.nodes[nanoNodeNames.listItem],
  attrs: (template, id) => ({
    id,
    kind: 'ordered',
    indent: template.type === 'list_item' ? clampIndent(template.indent) : 0,
    indentText: template.type === 'list_item' ? indentText(template.indentText) : null,
    start: template.type === 'list_item' && template.kind === 'ordered'
      ? markdownOrderedStart(template.start)
      : null,
    orderedStartText: template.type === 'list_item' && template.kind === 'ordered'
      ? orderedStartText(template.orderedStartText)
      : null,
    orderedMarker: template.type === 'list_item' && template.kind === 'ordered'
      ? orderedMarker(template.orderedMarker)
      : '.',
  }),
  behavior: {
    enter: outdentEmptyListBlockThen(
      splitBlockWithNextAttrs((attrs, id) => ({
        id,
        kind: 'ordered',
        indent: blockIndent(attrs),
        indentText: indentText(attrs.indentText),
        ...nextOrderedStartAttrs(attrs.start, attrs.orderedStartText),
        orderedMarker: orderedMarker(attrs.orderedMarker),
      })),
    ),
    backspaceAtStart: outdentListBlockAtStartThenParagraph,
  },
} satisfies BlockOption
