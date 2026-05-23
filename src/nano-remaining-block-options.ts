import { embedBlockOptions } from './nano-embed-block-options'
import { listBlockOptions } from './nano-list-block-options'
import { referenceBlockOptions } from './nano-reference-block-options'
import { richBlockOptions } from './nano-rich-block-options'
import type { BlockOption } from './assembly/capability'

export const remainingBlockOptions: readonly BlockOption[] = [
  ...listBlockOptions,
  ...referenceBlockOptions,
  ...richBlockOptions,
  ...embedBlockOptions,
]
