import type { NodeSpec } from 'prosemirror-model'

export const hardBreakNodeSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  selectable: false,
  parseDOM: [{ tag: 'br' }],
  toDOM: () => ['br'],
  leafText: () => '\n',
}
