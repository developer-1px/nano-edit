import type { BlockOption } from './nano-block-options'

export * from './nano-block-ui-decorations'
export * from './nano-block-ui-targets'
export * from './nano-block-ui-types'

export function blockOptionTitle(option: BlockOption): string {
  return option.title
}
