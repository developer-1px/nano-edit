import { TextSelection, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../../assembly/capability'
import type { BlockOption, EditorCapability } from '../../assembly/capability'
import { nanoNodeNames, nanoSchema } from '../../prosemirror-nano'
import {
  blockIndent,
  bulletMarker,
  checkedMarker,
  clampIndent,
  indentText,
  markdownIndentLevel,
  markdownIndentText,
  outdentEmptyListBlockThen,
  outdentListBlockAtStartThenParagraph,
  splitBlockWithNextAttrs,
  todoBoxTarget,
  toggleCheckedBlockTransaction,
} from '../prosemirror-block-behavior'

const todoBlockOption: BlockOption = {
  id: 'todo',
  label: '✓',
  title: 'Todo',
  markdownTrigger: '- [ ]',
  template: { type: 'todo', checked: false },
  shortcuts: [
    {
      name: 'todo-unchecked',
      pattern: /^([ \t]*)([-*+]) \[ \] $/,
      template: (match) => ({
        type: 'todo',
        checked: false,
        indent: markdownIndentLevel(match[1] ?? ''),
        indentText: markdownIndentText(match[1]),
        marker: bulletMarker(match[2]),
      }),
    },
    {
      name: 'todo-checked',
      pattern: /^([ \t]*)([-*+]) \[([xX])\] $/,
      template: (match) => ({
        type: 'todo',
        checked: true,
        indent: markdownIndentLevel(match[1] ?? ''),
        indentText: markdownIndentText(match[1]),
        marker: bulletMarker(match[2]),
        checkedMarker: checkedMarker(match[3]),
      }),
    },
  ],
  enterShortcuts: [{
    name: 'todo-line',
    pattern: /^([ \t]*)([-*+])\s+\[([ xX])\](?:\s+(.*))?$/,
    template: (match) => ({
      type: 'todo',
      checked: (match[3] ?? '').toLowerCase() === 'x',
      indent: markdownIndentLevel(match[1] ?? ''),
      indentText: markdownIndentText(match[1]),
      marker: bulletMarker(match[2]),
      checkedMarker: checkedMarker(match[3]),
      text: match[4] ?? '',
    }),
  }],
  toolbar: { label: '✓', title: 'Todo' },
  click: {
    target: todoBoxTarget,
    transaction: toggleCheckedBlockTransaction,
  },
  matchesTemplate: (template) => template.type === 'todo',
  matches: (node) => node.type.name === nanoNodeNames.todo,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.todo],
  attrs: (template, id) => ({
    id,
    checked: template.type === 'todo' ? template.checked : false,
    indent: template.type === 'todo' ? clampIndent(template.indent) : 0,
    indentText: template.type === 'todo' ? indentText(template.indentText) : null,
    marker: template.type === 'todo' ? bulletMarker(template.marker) : '-',
    checkedMarker: template.type === 'todo' ? checkedMarker(template.checkedMarker) : 'x',
  }),
  behavior: {
    enter: outdentEmptyListBlockThen(
      splitBlockWithNextAttrs((attrs, id) => ({
        id,
        checked: false,
        indent: blockIndent(attrs),
        indentText: indentText(attrs.indentText),
        marker: bulletMarker(attrs.marker),
        checkedMarker: checkedMarker(attrs.checkedMarker),
      })),
    ),
    backspaceAtStart: degradeTodoAtStartThenOutdent,
  },
}

export const todoCapability: EditorCapability = {
  id: 'nano.todo',
  blockOptions: [todoBlockOption],
}

function degradeTodoAtStartThenOutdent(context: BlockKeyboardContext): Transaction | null {
  if (context.$from.parentOffset !== 0) return null

  if (blockIndent(context.block.attrs) > 0) {
    return outdentListBlockAtStartThenParagraph(context)
  }

  const listItemType = context.state.schema.nodes[nanoNodeNames.listItem]
  if (!listItemType) return null

  const listItem = listItemType.create({
    id: context.block.attrs.id,
    kind: 'bullet',
    continuationIndents: context.block.attrs.continuationIndents,
    indent: 0,
    indentText: indentText(context.block.attrs.indentText),
    marker: bulletMarker(context.block.attrs.marker),
  }, context.block.content)
  const transaction = context.state.tr.replaceWith(context.blockPosition, context.blockPosition + context.block.nodeSize, listItem)
  transaction.setSelection(TextSelection.create(transaction.doc, context.blockPosition + 1))
  return transaction
}
