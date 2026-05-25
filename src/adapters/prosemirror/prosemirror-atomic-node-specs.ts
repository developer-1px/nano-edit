import type { NodeSpec } from 'prosemirror-model'
import {
  attachmentNodeSpec,
  bookmarkNodeSpec,
  noteRefNodeSpec,
  tagRefNodeSpec,
} from './prosemirror-reference-node-specs'
import { dividerNodeSpec } from './prosemirror-divider-node-spec'
import { imageNodeSpec } from './prosemirror-image-node-spec'
import { tableNodeSpec } from './prosemirror-table-node-spec'
import { nanoNodeNames } from './prosemirror-names'

export const nanoAtomicNodeSpecs: Record<string, NodeSpec> = {
  [nanoNodeNames.bookmark]: bookmarkNodeSpec,
  [nanoNodeNames.noteRef]: noteRefNodeSpec,
  [nanoNodeNames.tagRef]: tagRefNodeSpec,
  [nanoNodeNames.attachment]: attachmentNodeSpec,
  [nanoNodeNames.divider]: dividerNodeSpec,
  [nanoNodeNames.image]: imageNodeSpec,
  [nanoNodeNames.table]: tableNodeSpec,
}
