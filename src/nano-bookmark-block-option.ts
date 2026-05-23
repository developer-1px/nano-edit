import type { BlockOption } from './assembly/capability'
import {
  bookmarkTemplate,
  bookmarkNodeForBlockTemplate,
  markdownBookmarkTemplate,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from './prosemirror-nano'

export const bookmarkBlockOption = {
  id: 'bookmark',
  label: 'Url',
  title: 'Bookmark',
  markdownTrigger: 'https://',
  enterShortcuts: [{
    name: 'bookmark-url',
    pattern: /^(?:<(?:https?:\/\/|mailto:)[^<>\s]+>|(?:https?:\/\/|mailto:)[^\s<>()\[\]{}"']+)$/i,
    template: (match) => bookmarkTemplate(match[0] ?? ''),
  }, {
    name: 'bookmark-markdown-link',
    pattern: /^\[((?:\\.|[^\]\\])*)\]\((<(?:https?:\/\/|mailto:)[^<>\r\n]+>|(?:https?:\/\/|mailto:)\S+)(?:\s+"((?:\\.|[^"\\])*)")?\)$/i,
    template: (match) => markdownBookmarkTemplate(match),
  }],
  matchesTemplate: (template) => template.type === 'bookmark',
  matches: (node) => node.type.name === nanoNodeNames.bookmark,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.bookmark],
  attrs: (template, id) => ({
    id,
    href: template.type === 'bookmark' ? template.href : '',
    label: template.type === 'bookmark' ? template.label ?? '' : '',
    title: template.type === 'bookmark' ? template.title ?? '' : '',
    destinationStyle: template.type === 'bookmark' ? template.destinationStyle ?? '' : '',
    syntax: template.type === 'bookmark' ? template.syntax ?? 'bare' : 'bare',
  }),
  canSetTextblockMarkup: false,
  insertedNode: bookmarkNodeForBlockTemplate,
  replacementNode: bookmarkNodeForBlockTemplate,
} satisfies BlockOption
