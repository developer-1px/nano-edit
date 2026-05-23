import type { NanoViewContext } from './nano-view-context'
import { createNanoGutterKeyboardRuntime } from './nano-view-gutter-keyboard-runtime'

export interface NanoGutterRuntime {
  handleBlockInsertKeydown: (event: KeyboardEvent) => void
}

export function createNanoGutterRuntime(ctx: NanoViewContext): NanoGutterRuntime {
  const keyboard = createNanoGutterKeyboardRuntime(ctx)

  return {
    handleBlockInsertKeydown: keyboard.handleBlockInsertKeydown,
  }
}
