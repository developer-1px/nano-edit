import type { BlockOption } from './assembly/capability'
import { attachmentBlockOption } from './nano-attachment-block-option'
import { bookmarkBlockOption } from './nano-bookmark-block-option'
import { imageBlockOption } from './nano-image-block-option'
import { tableBlockOption } from './nano-table-block-option'

export const embedBlockOptions: readonly BlockOption[] = [
  bookmarkBlockOption,
  attachmentBlockOption,
  imageBlockOption,
  tableBlockOption,
]
