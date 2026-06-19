import type { NanoViewContext } from './context'

export function destroyNanoView(ctx: NanoViewContext): void {
  if (ctx.destroyed) return
  ctx.destroyed = true
  ctx.engineUnsubscribe?.()
  ctx.engineUnsubscribe = null
  ctx.editor.removeEventListener('keydown', ctx.slashKeydownListener, true)
  ctx.shell.destroy()
  ctx.view.destroy()
  ctx.root.remove()
}
