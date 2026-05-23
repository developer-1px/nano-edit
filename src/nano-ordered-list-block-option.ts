import type { BlockOption } from './assembly/capability'
import {
  blockIndent,
  clampIndent,
  indentText,
  markdownIndentLevel,
  markdownIndentText,
  markdownOrderedStart,
  nextOrderedStartAttrs,
  orderedMarker,
  orderedStartTemplateAttrs,
  orderedStartText,
  outdentEmptyListBlockThen,
  outdentListBlockAtStartThenParagraph,
  splitBlockWithNextAttrs,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from './prosemirror-nano'

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
      ...orderedStartTemplateAttrs(match[2]),
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
      ...orderedStartTemplateAttrs(match[2]),
      orderedMarker: orderedMarker(match[3]),
      text: match[4] ?? '',
    }),
  }],
  toolbar: { label: '1.', title: 'Numbered List' },
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
        ...nextOrderedStartAttrs(attrs),
        orderedMarker: orderedMarker(attrs.orderedMarker),
      })),
    ),
    backspaceAtStart: outdentListBlockAtStartThenParagraph,
  },
} satisfies BlockOption
