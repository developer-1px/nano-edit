import type { MarkSpec } from 'prosemirror-model'
import { basicMarkSpecs } from './prosemirror-basic-mark-specs'
import { linkMarkSpec } from './prosemirror-link-mark-spec'
import { referenceMarkSpecs } from './prosemirror-reference-mark-specs'
import { nanoMarkNames } from './prosemirror-names'

export const nanoMarkSpecs: Record<string, MarkSpec> = {
  ...basicMarkSpecs,
  ...referenceMarkSpecs,
  [nanoMarkNames.link]: linkMarkSpec,
}
