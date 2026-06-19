import { Schema, type MarkSpec, type NodeSpec } from 'prosemirror-model'
import { basicMarkSpecs } from './prosemirror-basic-mark-specs'
import { nanoCodeNodeSpecs } from './prosemirror-code-node-specs'
import { customBlockNodeSpec } from './prosemirror-custom-block'
import { dividerNodeSpec } from './prosemirror-divider-node-spec'
import { hardBreakNodeSpec } from './prosemirror-hard-break-node-spec'
import { linkMarkSpec } from './prosemirror-link-mark-spec'
import { imageNodeSpec } from './prosemirror-image-node-spec'
import { referenceMarkSpecs } from './prosemirror-reference-mark-specs'
import { todoNodeSpec } from '../../capabilities/todo/prosemirror'
import { footnoteNodeSpec } from './prosemirror-footnote-node-spec'
import {
  attachmentNodeSpec,
  bookmarkNodeSpec,
  mentionNodeSpec,
  noteRefNodeSpec,
  tagRefNodeSpec,
} from './prosemirror-reference-node-specs'
import { tableNodeSpec } from './prosemirror-table-node-spec'
import {
  headingNodeSpec,
  paragraphNodeSpec,
} from './prosemirror-text-flow-node-specs'
import {
  calloutNodeSpec,
  quoteNodeSpec,
} from './prosemirror-quote-flow-node-specs'
import { listItemNodeSpec } from './prosemirror-list-flow-node-spec'
import {
  nanoMarkNames,
  nanoNodeNames,
} from './prosemirror-names'

const nanoFlowNodeSpecs: Record<string, NodeSpec> = {
  [nanoNodeNames.paragraph]: paragraphNodeSpec,
  [nanoNodeNames.heading]: headingNodeSpec,
  [nanoNodeNames.quote]: quoteNodeSpec,
  [nanoNodeNames.callout]: calloutNodeSpec,
  [nanoNodeNames.customBlock]: customBlockNodeSpec,
  [nanoNodeNames.todo]: todoNodeSpec,
  [nanoNodeNames.listItem]: listItemNodeSpec,
  [nanoNodeNames.footnote]: footnoteNodeSpec,
}

const nanoAtomicNodeSpecs: Record<string, NodeSpec> = {
  [nanoNodeNames.bookmark]: bookmarkNodeSpec,
  [nanoNodeNames.noteRef]: noteRefNodeSpec,
  [nanoNodeNames.tagRef]: tagRefNodeSpec,
  [nanoNodeNames.attachment]: attachmentNodeSpec,
  [nanoNodeNames.divider]: dividerNodeSpec,
  [nanoNodeNames.image]: imageNodeSpec,
  [nanoNodeNames.table]: tableNodeSpec,
}

const nanoInlineNodeSpecs: Record<string, NodeSpec> = {
  [nanoNodeNames.mention]: mentionNodeSpec,
  [nanoNodeNames.hardBreak]: hardBreakNodeSpec,
}

const nanoMarkSpecs: Record<string, MarkSpec> = {
  ...basicMarkSpecs,
  ...referenceMarkSpecs,
  [nanoMarkNames.link]: linkMarkSpec,
}

export const nanoSchema = new Schema({
  nodes: {
    [nanoNodeNames.doc]: { content: 'block+' },
    ...nanoFlowNodeSpecs,
    ...nanoCodeNodeSpecs,
    ...nanoAtomicNodeSpecs,
    ...nanoInlineNodeSpecs,
    [nanoNodeNames.text]: { group: 'inline' },
  },
  marks: nanoMarkSpecs,
})
