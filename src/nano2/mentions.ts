import { Fragment } from 'prosemirror-model'
import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'

export interface Nano2MentionAttrs {
  id: string
  label?: string
}

export interface Nano2InsertMentionOptions {
  appendSpace?: boolean
  from?: number
  to?: number
}

export function nano2InsertMentionTransaction(
  state: EditorState,
  mention: Nano2MentionAttrs,
  options: Nano2InsertMentionOptions = {},
): Transaction | null {
  const id = mention.id.trim()
  if (!id) return null

  const mentionType = state.schema.nodes[nanoNodeNames.mention]
  if (!mentionType) return null

  const from = options.from ?? state.selection.from
  const to = options.to ?? state.selection.to
  const mentionNode = mentionType.create({
    id,
    label: mention.label ?? id,
  })
  const inserted = options.appendSpace === false
    ? Fragment.from(mentionNode)
    : Fragment.fromArray([mentionNode, state.schema.text(' ')])
  const tr = state.tr
    .replaceWith(from, to, inserted)
    .setMeta('inputType', 'nano2InsertMention')

  return tr.setSelection(TextSelection.create(tr.doc, from + inserted.size))
}
