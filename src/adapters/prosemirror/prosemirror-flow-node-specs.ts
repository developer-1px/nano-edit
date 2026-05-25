import type { NodeSpec } from 'prosemirror-model'
import { todoNodeSpec } from '../../capabilities/todo/prosemirror'
import { footnoteNodeSpec } from './prosemirror-footnote-node-spec'
import {
  headingNodeSpec,
  paragraphNodeSpec,
} from './prosemirror-text-flow-node-specs'
import {
  calloutNodeSpec,
  quoteNodeSpec,
} from './prosemirror-quote-flow-node-specs'
import { listItemNodeSpec } from './prosemirror-list-flow-node-spec'
import { nanoNodeNames } from './prosemirror-names'

export const nanoFlowNodeSpecs: Record<string, NodeSpec> = {
  [nanoNodeNames.paragraph]: paragraphNodeSpec,
  [nanoNodeNames.heading]: headingNodeSpec,
  [nanoNodeNames.quote]: quoteNodeSpec,
  [nanoNodeNames.callout]: calloutNodeSpec,
  [nanoNodeNames.todo]: todoNodeSpec,
  [nanoNodeNames.listItem]: listItemNodeSpec,
  [nanoNodeNames.footnote]: footnoteNodeSpec,
}
