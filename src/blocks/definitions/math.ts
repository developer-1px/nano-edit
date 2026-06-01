import type { BlockOption } from '../../assembly/capability'
import {
  convertBlockToParagraphAtStart,
  mathFormula,
  mathStyle,
} from '../options/index'
import { nanoNodeNames, nanoSchema } from '../../adapters/prosemirror/prosemirror-nano'

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
