import type { NanoViewContext } from './context'
import type { NanoSlashCommandRuntime } from './slash-command'

export function installNanoSlashCommandListeners(
  ctx: NanoViewContext,
  slashCommands: NanoSlashCommandRuntime,
): void {
  ctx.slashKeydownListener = (event) => slashCommands.handleSlashKeydown(event)
}

export function destroyNanoView(ctx: NanoViewContext): void {
  if (ctx.destroyed) return
  ctx.destroyed = true
  ctx.editor.removeEventListener('keydown', ctx.slashKeydownListener, true)
  ctx.shell.destroy()
  ctx.view.destroy()
  ctx.root.remove()
}
