import type { BlockOption, EditorCapability } from '../../assembly/capability'
import { nanoNodeNames, nanoSchema } from '../../prosemirror-nano'
import {
  decreaseHeadingAtStartThenParagraph,
  exitEmptyThen,
  headingLevel,
  splitBlockToParagraph,
} from '../prosemirror-block-behavior'

const headingLevels = [1, 2, 3, 4, 5, 6] as const

export const basicCapability: EditorCapability = {
  id: 'nano.basic',
  blockOptions: [
    {
      id: 'paragraph',
      label: '¶',
      title: 'Paragraph',
      template: { type: 'paragraph' },
      keyBindings: [{ key: 'Mod-Enter', action: 'insertAfterActive' }],
      matchesTemplate: (template) => template.type === 'paragraph',
      matches: (node) => node.type.name === nanoNodeNames.paragraph,
      nodeType: () => nanoSchema.nodes[nanoNodeNames.paragraph],
      attrs: (_command, id) => ({ id }),
    },
    ...headingLevels.map((level) => headingBlockOption(level)),
  ],
}

function headingBlockOption(level: (typeof headingLevels)[number]): BlockOption {
  return {
    id: `heading-${level}`,
    label: `H${level}`,
    title: `Heading ${level}`,
    markdownTrigger: '#'.repeat(level),
    template: { type: 'heading', level },
    shortcuts: [{
      name: `heading-${level}`,
      pattern: new RegExp(`^#{${level}} $`),
      template: () => ({ type: 'heading', level }),
    }],
    enterShortcuts: [{
      name: `heading-${level}-line`,
      pattern: new RegExp(`^#{${level}}(?:\\s+(.*))?$`),
      template: (match) => ({ type: 'heading', level, text: match[1] ?? '' }),
    }],
    toolbar: level === 1
      ? {
          label: 'H1',
          title: 'Heading 1',
          active: (node) => node.type.name === nanoNodeNames.heading && headingLevel(node) === 1,
        }
      : undefined,
    matchesTemplate: (template) => template.type === 'heading' && template.level === level,
    matches: (node) => node.type.name === nanoNodeNames.heading && headingLevel(node) === level,
    nodeType: () => nanoSchema.nodes[nanoNodeNames.heading],
    attrs: (template, id) => ({
      id,
      level: template.type === 'heading' ? template.level : level,
    }),
    behavior: {
      enter: exitEmptyThen(splitBlockToParagraph),
      backspaceAtStart: decreaseHeadingAtStartThenParagraph,
    },
  }
}
