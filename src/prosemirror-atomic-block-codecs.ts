import { attachmentBlockCodec } from './prosemirror-attachment-block-codec'
import { bookmarkBlockCodec } from './prosemirror-bookmark-block-codec'
import { dividerBlockCodec } from './prosemirror-divider-block-codec'
import { imageBlockCodec } from './prosemirror-image-block-codec'
import { noteRefBlockCodec } from './prosemirror-note-ref-block-codec'
import { tableBlockCodec } from './prosemirror-table-block-codec'
import { tagRefBlockCodec } from './prosemirror-tag-ref-block-codec'
import type { AnyNanoBlockCodec } from './prosemirror-block-codec-types'

export const nanoAtomicBlockCodecs: readonly AnyNanoBlockCodec[] = [
  bookmarkBlockCodec,
  noteRefBlockCodec,
  tagRefBlockCodec,
  attachmentBlockCodec,
  dividerBlockCodec,
  imageBlockCodec,
  tableBlockCodec,
]
