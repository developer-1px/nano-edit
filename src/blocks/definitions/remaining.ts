import { embedBlockOptions } from './embed'
import { listBlockOptions } from './list'
import { referenceBlockOptions } from './reference'
import { richBlockOptions } from './rich'
import type { BlockOption } from '../../assembly/capability'

export const remainingBlockOptions: readonly BlockOption[] = [
  ...listBlockOptions,
  ...referenceBlockOptions,
  ...richBlockOptions,
  ...embedBlockOptions,
]
