import { blockActionCommands } from './nano-command-actions-block'
import { documentActionCommands } from './nano-command-actions-document'
import { historyActionCommands } from './nano-command-actions-history'
import { inspectorActionCommands } from './nano-command-actions-inspector'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './nano-command-types'

export function actionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    ...inspectorActionCommands(options),
    ...documentActionCommands(options),
    ...blockActionCommands(options),
    ...historyActionCommands(options),
  ]
}
