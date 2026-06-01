import type { BlockOption } from '../../assembly/capability'
import { calloutBlockOptions } from './callout'
import { codeBlockOption } from './code'
import { dividerBlockOption } from './divider'
import { mathBlockOption } from './math'
import { quoteBlockOption } from './quote'

export const richBlockOptions: readonly BlockOption[] = [
  quoteBlockOption,
  ...calloutBlockOptions,
  codeBlockOption,
  mathBlockOption,
  dividerBlockOption,
]
