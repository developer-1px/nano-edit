import type { BlockOption } from '../assembly/capability'
import { calloutBlockOptions } from './nano-block-callout-options'
import { codeBlockOption } from './nano-code-block-option'
import { dividerBlockOption } from './nano-divider-block-option'
import { mathBlockOption } from './nano-math-block-option'
import { quoteBlockOption } from './nano-quote-block-option'

export const richBlockOptions: readonly BlockOption[] = [
  quoteBlockOption,
  ...calloutBlockOptions,
  codeBlockOption,
  mathBlockOption,
  dividerBlockOption,
]
