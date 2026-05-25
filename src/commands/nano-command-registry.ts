import { actionCommands } from './nano-command-actions'
import { blockCommands } from './nano-command-blocks'
import { markCommands } from './nano-command-marks'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './nano-command-types'

export type {
  NanoCommand,
  NanoCommandActions,
  NanoCommandsOptions,
} from './nano-command-types'

export function nanoCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    ...blockCommands(options),
    ...markCommands(options),
    ...actionCommands(options),
  ]
}
