import type { BlockOption } from '../assembly/capability'
import {
  dividerMarker,
  dividerMarkerLength,
  dividerNode,
  dividerWithTrailingParagraph,
  generatedBlockId,
} from './nano-block-option-internals'
import { nanoNodeNames, nanoSchema } from '../adapters/prosemirror/prosemirror-nano'

export const dividerBlockOption = {
  id: 'divider',
  label: '—',
  title: 'Divider',
  markdownTrigger: '---',
  template: { type: 'divider' },
  shortcuts: [{
    name: 'divider',
    pattern: /^(?:-{3,}|\*{3,}|_{3,})$/,
    template: (match) => ({
      type: 'divider',
      marker: dividerMarker(match[0]),
      markerLength: dividerMarkerLength(match[0].length),
    }),
  }],
  matchesTemplate: (template) => template.type === 'divider',
  matches: (node) => node.type.name === nanoNodeNames.divider,
  nodeType: () => nanoSchema.nodes[nanoNodeNames.divider],
  attrs: (template, id) => ({
    id,
    marker: template.type === 'divider' ? dividerMarker(template.marker) : '---',
    markerLength: template.type === 'divider' ? dividerMarkerLength(template.markerLength) : 3,
  }),
  canSetTextblockMarkup: false,
  insertedNode: (template, id) => dividerWithTrailingParagraph(
    id,
    template.type === 'divider' ? template.marker : undefined,
    template.type === 'divider' ? template.markerLength : undefined,
  ),
  replacementNode: (template, source) => {
    const id = typeof source.attrs.id === 'string' && source.attrs.id
      ? source.attrs.id
      : generatedBlockId('b', 'changed')
    const sourceMarker = source.type.name === nanoNodeNames.divider ? dividerMarker(source.attrs.marker) : undefined
    const sourceMarkerLength = source.type.name === nanoNodeNames.divider ? dividerMarkerLength(source.attrs.markerLength) : undefined
    const marker = template.type === 'divider' ? template.marker ?? sourceMarker : undefined
    const markerLength = template.type === 'divider' ? template.markerLength ?? sourceMarkerLength : undefined
    if (source.type.name === nanoNodeNames.divider) {
      return dividerNode(id, marker, markerLength)
    }
    return dividerWithTrailingParagraph(id, marker, markerLength)
  },
} satisfies BlockOption
