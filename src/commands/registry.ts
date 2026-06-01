import { actionCommands } from './actions'
import { blockCommands } from './blocks'
import { markCommands } from './marks'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './types'

export type {
  NanoCommand,
  NanoCommandActions,
  NanoCommandsOptions,
} from './types'

export function nanoCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    ...blockCommands(options),
    ...markCommands(options),
    ...actionCommands(options),
  ]
}
