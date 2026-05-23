import type { BlockOption } from './assembly/capability'
import {
  attachmentNodeForBlockTemplate,
  markdownAttachmentTemplate,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from './prosemirror-nano'

export const attachmentBlockOption = {
  id: 'attachment',
  label: 'File',
  title: 'Attachment',
  markdownTrigger: '[file]()',
  template: { type: 'attachment', src: 'files/brief.pdf', label: 'Project brief' },
  enterShortcuts: [{
    name: 'attachment-markdown-link',
    pattern: /^\[((?:\\.|[^\]\\])*)\]\((<(?!(?:https?:\/\/|mailto:|#))[^<>\r\n]*\.[A-Za-z0-9]{1,12}(?:[?#][^<>\r\n]*)?>|(?!(?:https?:\/\/|mailto:|#))\S*\.[A-Za-z0-9]{1,12}(?:[?#]\S*)?)(?:\s+"((?:\\.|[^"\\])*)")?\)$/i,
    template: (match) => markdownAttachmentTemplate(match),
  }],
  matchesTemplate: (template) => template.type === 'attachment',
  matches: (node) => node.type.name === nanoNodeNames.attachment,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.attachment],
  attrs: (template, id) => ({
    id,
    src: template.type === 'attachment' ? template.src : 'files/brief.pdf',
    label: template.type === 'attachment' ? template.label ?? '' : '',
    title: template.type === 'attachment' ? template.title ?? '' : '',
    destinationStyle: template.type === 'attachment' ? template.destinationStyle ?? '' : '',
  }),
  canSetTextblockMarkup: false,
  insertedNode: attachmentNodeForBlockTemplate,
  replacementNode: attachmentNodeForBlockTemplate,
} satisfies BlockOption
