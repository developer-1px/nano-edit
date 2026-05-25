import type { BlockOption } from '../assembly/capability'
import {
  blockIndent,
  bulletMarker,
  clampIndent,
  indentText,
  markdownIndentLevel,
  markdownIndentText,
  outdentEmptyListBlockThen,
  outdentListBlockAtStartThenParagraph,
  splitBlockWithNextAttrs,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export const bulletListBlockOption = {
  id: 'bullet',
  label: '•',
  title: 'Bullet List',
  markdownTrigger: '-',
  template: { type: 'list_item', kind: 'bullet' },
  keyBindings: [{ key: 'Shift-Mod-8' }],
  shortcuts: [{
    name: 'bullet-list',
    pattern: /^([ \t]*)([-+*]) $/,
    template: (match) => ({
      type: 'list_item',
      kind: 'bullet',
      indent: markdownIndentLevel(match[1] ?? ''),
      indentText: markdownIndentText(match[1]),
      marker: bulletMarker(match[2]),
    }),
  }],
  enterShortcuts: [{
    name: 'bullet-line',
    pattern: /^([ \t]*)([-+*])(?:\s+(.*))?$/,
    template: (match) => ({
      type: 'list_item',
      kind: 'bullet',
      indent: markdownIndentLevel(match[1] ?? ''),
      indentText: markdownIndentText(match[1]),
      marker: bulletMarker(match[2]),
      text: match[3] ?? '',
    }),
  }],
  matchesTemplate: (template) => template.type === 'list_item' && template.kind === 'bullet',
  matches: (node) => node.type.name === nanoNodeNames.listItem && node.attrs.kind === 'bullet',
  nodeType: () => nanoSchema.nodes[nanoNodeNames.listItem],
  attrs: (template, id) => ({
    id,
    kind: 'bullet',
    indent: template.type === 'list_item' ? clampIndent(template.indent) : 0,
    indentText: template.type === 'list_item' ? indentText(template.indentText) : null,
    marker: template.type === 'list_item' && template.kind === 'bullet' ? bulletMarker(template.marker) : '-',
  }),
  behavior: {
    enter: outdentEmptyListBlockThen(
      splitBlockWithNextAttrs((attrs, id) => ({
        id,
        kind: 'bullet',
        indent: blockIndent(attrs),
        indentText: indentText(attrs.indentText),
        marker: bulletMarker(attrs.marker),
      })),
    ),
    backspaceAtStart: outdentListBlockAtStartThenParagraph,
  },
} satisfies BlockOption
