import type { BlockOption } from '../../assembly/capability'
import {
  codeFenceInfo,
  codeFenceLength,
  codeFenceMarker,
  codeFenceSpacing,
  convertBlockToParagraphAtStart,
} from '../options/index'
import { nanoNodeNames, nanoSchema } from '../../adapters/prosemirror/prosemirror-nano'

export const codeBlockOption = {
  id: 'code',
  label: '{}',
  title: 'Code',
  markdownTrigger: '```',
  template: { type: 'code' },
  shortcuts: [{
    name: 'code',
    pattern: /^(```+|~~~+)([ \t]*)([^`~]*?) $/,
    template: (match) => ({
      type: 'code',
      language: codeFenceInfo(match[3]),
      fenceInfoSpacing: codeFenceInfo(match[3]) ? codeFenceSpacing(match[2]) : undefined,
      fenceMarker: codeFenceMarker(match[1]?.[0]),
      fenceLength: codeFenceLength(match[1]?.length),
    }),
  }],
  enterShortcuts: [{
    name: 'code-fence',
    pattern: /^(```+|~~~+)([ \t]*)([^`~]*)$/,
    template: (match) => ({
      type: 'code',
      language: codeFenceInfo(match[3]),
      fenceInfoSpacing: codeFenceInfo(match[3]) ? codeFenceSpacing(match[2]) : undefined,
      fenceMarker: codeFenceMarker(match[1]?.[0]),
      fenceLength: codeFenceLength(match[1]?.length),
    }),
  }],
  matchesTemplate: (template) => template.type === 'code',
  matches: (node) => node.type.name === nanoNodeNames.codeBlock,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.codeBlock],
  attrs: (template, id) => ({
    id,
    language: template.type === 'code' ? template.language ?? null : null,
    fenceIndent: template.type === 'code' ? codeFenceSpacing(template.fenceIndent) : '',
    fenceInfoSpacing: template.type === 'code' ? codeFenceSpacing(template.fenceInfoSpacing) : '',
    fenceMarker: template.type === 'code' ? codeFenceMarker(template.fenceMarker) : '`',
    fenceLength: template.type === 'code' ? codeFenceLength(template.fenceLength) : 3,
  }),
  acceptsBlockInputHints: false,
  replacementContent: (source) => source.textContent ? nanoSchema.text(source.textContent) : null,
  behavior: {
    backspaceAtStart: convertBlockToParagraphAtStart,
  },
} satisfies BlockOption
