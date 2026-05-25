import type { BlockOption } from '../assembly/capability'
import { bulletListBlockOption } from './nano-bullet-list-block-option'
import { orderedListBlockOption } from './nano-ordered-list-block-option'

export const listBlockOptions: readonly BlockOption[] = [
  bulletListBlockOption,
  orderedListBlockOption,
]
