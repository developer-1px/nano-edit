import { blockActionCommands } from './actions-block'
import { documentActionCommands } from './actions-document'
import { historyActionCommands } from './actions-history'
import { inspectorActionCommands } from './actions-inspector'
import type {
  NanoCommand,
  NanoCommandsOptions,
} from './types'

export function actionCommands(options: NanoCommandsOptions): NanoCommand[] {
  return [
    ...inspectorActionCommands(options),
    ...documentActionCommands(options),
    ...blockActionCommands(options),
    ...historyActionCommands(options),
  ]
}
