import type { BlockOption } from '../../assembly/capability'
import { convertBlockToParagraphAtStart } from '../../capabilities/block-behavior-paragraph'
import { mathStyle } from '../../codecs/markdown/nano-markdown-code-utils'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../../adapters/prosemirror/prosemirror-schema'

export const mathBlockOption = {
  id: 'math',
  label: '∑',
  title: 'Math',
  markdownTrigger: '$$',
  template: { type: 'math' },
  shortcuts: [{
    name: 'math',
    pattern: /^\$\$ $/,
    template: () => ({ type: 'math' }),
  }],
  enterShortcuts: [{
    name: 'math-line',
    pattern: /^\$\$(.*)\$\$$/,
    template: (match) => ({ type: 'math', text: mathFormula(match[1] ?? ''), mathStyle: 'single' }),
  }],
  matchesTemplate: (template) => template.type === 'math',
  matches: (node) => node.type.name === nanoNodeNames.mathBlock,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.mathBlock],
  attrs: (template, id) => ({
    id,
    mathStyle: template.type === 'math' ? mathStyle(template.mathStyle) : '',
  }),
  acceptsBlockInputHints: false,
  replacementContent: (source) => source.textContent ? nanoSchema.text(source.textContent) : null,
  behavior: {
    backspaceAtStart: convertBlockToParagraphAtStart,
  },
} satisfies BlockOption

function mathFormula(source: unknown): string {
  return typeof source === 'string'
    ? source.replace(/\r\n?/g, '\n').trim()
    : ''
}
