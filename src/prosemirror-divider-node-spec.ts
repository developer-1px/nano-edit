import type { NodeSpec } from 'prosemirror-model'
import {
  dividerMarkdown,
  dividerMarker,
  dividerMarkerLength,
} from './prosemirror-block-attrs'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'

export const dividerNodeSpec: NodeSpec = {
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { id: { default: null }, marker: { default: '---' }, markerLength: { default: 3 } },
  parseDOM: [
    {
      tag: 'div.nano-divider',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        const token = element.dataset.marker ?? element.querySelector('.nano-divider-token')?.textContent
        return { marker: dividerMarker(token), markerLength: dividerMarkerLength(element.dataset.markerLength ?? token?.length) }
      },
    },
    { tag: 'hr.nano-divider' },
  ],
  toDOM: (node) => [
    'div',
    {
      class: 'nano-block nano-divider',
      'data-id': node.attrs.id,
      'data-marker': dividerMarker(node.attrs.marker),
      'data-marker-length': String(dividerMarkerLength(node.attrs.markerLength)),
      role: 'separator',
      'aria-label': 'Divider',
    },
    ['span', hiddenSourceTokenAttrs('nano-divider-token'), dividerMarkdown(node.attrs.marker, node.attrs.markerLength)],
  ],
}
