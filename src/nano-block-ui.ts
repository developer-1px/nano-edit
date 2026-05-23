import type { BlockOption } from './nano-block-options'

export * from './nano-block-ui-decorations'

export function blockOptionTitle(option: BlockOption): string {
  return option.title
}
