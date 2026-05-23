import { Schema } from 'prosemirror-model'
import { nanoAtomicNodeSpecs } from './prosemirror-atomic-node-specs'
import { nanoCodeNodeSpecs } from './prosemirror-code-node-specs'
import { nanoFlowNodeSpecs } from './prosemirror-flow-node-specs'
import { nanoMarkSpecs } from './prosemirror-mark-specs'
import { nanoNodeNames } from './prosemirror-names'

export const nanoSchema = new Schema({
  nodes: {
    [nanoNodeNames.doc]: { content: 'block+' },
    ...nanoFlowNodeSpecs,
    ...nanoCodeNodeSpecs,
    ...nanoAtomicNodeSpecs,
    [nanoNodeNames.text]: { group: 'inline' },
  },
  marks: nanoMarkSpecs,
})
