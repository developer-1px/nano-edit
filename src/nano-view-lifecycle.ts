import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterRuntime } from './nano-view-gutter-runtime'

export function installNanoGutterListeners(
  ctx: NanoViewContext,
  gutter: NanoGutterRuntime,
): void {
  ctx.slashKeydownListener = (event) => gutter.handleBlockInsertKeydown(event)
}

export function destroyNanoView(ctx: NanoViewContext): void {
  if (ctx.destroyed) return
  ctx.destroyed = true
  ctx.editor.removeEventListener('keydown', ctx.slashKeydownListener, true)
  ctx.shell.destroy()
  ctx.view.destroy()
  ctx.root.remove()
}
