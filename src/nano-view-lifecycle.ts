import type { NanoViewContext } from './nano-view-context'
import type { NanoGutterRuntime } from './nano-view-gutter-runtime'

export function installNanoGutterListeners(
  ctx: NanoViewContext,
  gutter: NanoGutterRuntime,
): void {
  ctx.blockAddClickListener = (event) => gutter.handleBlockAddClick(event)
  ctx.blockHandleClickListener = (event) => gutter.handleBlockHandleClick(event)
  ctx.blockInsertHoverListener = (event) => gutter.handleBlockInsertHover(event)
  ctx.blockInsertKeydownListener = (event) => gutter.handleBlockInsertKeydown(event)
  ctx.gutterOutsideClickListener = (event) => gutter.handleGutterOutsideClick(event)
}

export function destroyNanoView(ctx: NanoViewContext): void {
  ctx.editor.removeEventListener('click', ctx.blockAddClickListener)
  ctx.editor.removeEventListener('click', ctx.blockHandleClickListener)
  ctx.editor.removeEventListener('mouseover', ctx.blockInsertHoverListener)
  ctx.editor.removeEventListener('keydown', ctx.blockInsertKeydownListener, true)
  document.removeEventListener('click', ctx.gutterOutsideClickListener)
  ctx.shell.destroy()
  ctx.view.destroy()
}
