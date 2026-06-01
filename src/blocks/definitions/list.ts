import type { BlockOption } from '../../assembly/capability'
import { bulletListBlockOption } from './bullet-list'
import { orderedListBlockOption } from './ordered-list'

export const listBlockOptions: readonly BlockOption[] = [
  bulletListBlockOption,
  orderedListBlockOption,
]
