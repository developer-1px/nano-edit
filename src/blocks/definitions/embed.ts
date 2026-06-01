import type { BlockOption } from '../../assembly/capability'
import { attachmentBlockOption } from './attachment'
import { bookmarkBlockOption } from './bookmark'
import { imageBlockOption } from './image'
import { tableBlockOption } from './table'

export const embedBlockOptions: readonly BlockOption[] = [
  bookmarkBlockOption,
  attachmentBlockOption,
  imageBlockOption,
  tableBlockOption,
]
