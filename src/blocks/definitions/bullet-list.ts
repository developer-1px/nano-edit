import type { BlockOption } from '../../assembly/capability'
import {
  blockIndent,
  clampIndent,
  indentText,
} from '../../capabilities/block-indent-values'
import {
  markdownIndentLevel,
  markdownIndentText,
} from '../../codecs/markdown/nano-markdown-list-attrs'
import { bulletMarker } from '../../codecs/markdown/nano-markdown-marker-attrs'
import {
  outdentEmptyListBlockThen,
  outdentListBlockAtStartThenParagraph,
} from '../../capabilities/block-behavior-list'
import { splitBlockWithNextAttrs } from '../../capabilities/block-behavior-split'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'

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
