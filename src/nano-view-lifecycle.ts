import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterRuntime } from './nano-view-gutter-runtime'

export function installNanoGutterListeners(
  ctx: NanoViewContext,
  gutter: NanoGutterRuntime,
): void {
  ctx.blockInsertClickListener = (event) => gutter.handleBlockInsertClick(event)
  ctx.blockInsertHoverListener = (event) => gutter.handleBlockInsertHover(event)
  ctx.blockInsertKeydownListener = (event) => gutter.handleBlockInsertKeydown(event)
  ctx.gutterOutsideClickListener = (event) => gutter.handleGutterOutsideClick(event)
}

export function destroyNanoView(ctx: NanoViewContext): void {
  if (ctx.destroyed) return
  ctx.destroyed = true
  ctx.editor.removeEventListener('click', ctx.blockInsertClickListener)
  ctx.editor.removeEventListener('mouseover', ctx.blockInsertHoverListener)
  ctx.editor.removeEventListener('keydown', ctx.blockInsertKeydownListener, true)
  document.removeEventListener('click', ctx.gutterOutsideClickListener)
  ctx.shell.destroy()
  ctx.view.destroy()
  ctx.root.remove()
}
