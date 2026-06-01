import type { BlockOption } from '../../assembly/capability'
import {
  imageNodeForBlockTemplate,
  markdownImageTemplate,
} from '../options/index'
import { nanoNodeNames, nanoSchema } from '../../adapters/prosemirror/prosemirror-nano'

export const imageBlockOption = {
  id: 'image',
  label: 'Img',
  title: 'Image',
  markdownTrigger: '![]()',
  shortcuts: [{
    name: 'image',
    pattern: /^!\[((?:\\.|[^\]\\])*)\]\((<[^<>\r\n]+>|\S+)(?:\s+"((?:\\.|[^"\\])*)")?\)$/,
    template: (match) => markdownImageTemplate(match),
  }],
  enterShortcuts: [{
    name: 'image-line',
    pattern: /^!\[((?:\\.|[^\]\\])*)\]\((<[^<>\r\n]+>|\S+)(?:\s+"((?:\\.|[^"\\])*)")?\)$/,
    template: (match) => markdownImageTemplate(match),
  }],
  matchesTemplate: (template) => template.type === 'image',
  matches: (node) => node.type.name === nanoNodeNames.image,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.image],
  attrs: (template, id) => ({
    id,
    src: template.type === 'image' ? template.src : '',
    alt: template.type === 'image' ? template.alt ?? '' : '',
    destinationStyle: template.type === 'image' ? template.destinationStyle ?? '' : '',
    title: template.type === 'image' ? template.title ?? '' : '',
  }),
  canSetTextblockMarkup: false,
  insertedNode: imageNodeForBlockTemplate,
  replacementNode: imageNodeForBlockTemplate,
} satisfies BlockOption
