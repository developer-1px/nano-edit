import type { BlockOption } from '../assembly/capability'
import {
  defaultTableRows,
  tableNodeForBlockTemplate,
  tableRowsForShortcut,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export const tableBlockOption = {
  id: 'table',
  label: 'Tbl',
  title: 'Table',
  markdownTrigger: '| |',
  template: { type: 'table' },
  shortcuts: [{
    name: 'table-row',
    pattern: /^(?:\|\s*\||\|.*\|.*\|)$/,
    template: (match) => ({ type: 'table', rows: tableRowsForShortcut(match[0]!) }),
  }],
  enterShortcuts: [{
    name: 'table-row',
    pattern: /^(?:\|\s*\||\|.*\|.*\|)$/,
    template: (match) => ({ type: 'table', rows: tableRowsForShortcut(match[0]!) }),
  }],
  matchesTemplate: (template) => template.type === 'table',
  matches: (node) => node.type.name === nanoNodeNames.table,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.table],
  attrs: (template, id) => ({
    id,
    rows: template.type === 'table' ? template.rows ?? defaultTableRows() : defaultTableRows(),
  }),
  canSetTextblockMarkup: false,
  insertedNode: tableNodeForBlockTemplate,
  replacementNode: tableNodeForBlockTemplate,
} satisfies BlockOption
