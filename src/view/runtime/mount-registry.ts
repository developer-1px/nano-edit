import type { NanoViewHandle } from './context'

const mountedNanoViews = new WeakMap<HTMLElement, NanoViewHandle>()

export function destroyMountedNanoView(mount: HTMLElement): void {
  mountedNanoViews.get(mount)?.destroy()
}

export function rememberMountedNanoView(mount: HTMLElement, handle: NanoViewHandle): void {
  mountedNanoViews.set(mount, handle)
}

export function forgetMountedNanoView(mount: HTMLElement, handle: NanoViewHandle): void {
  if (mountedNanoViews.get(mount) !== handle) return
  mountedNanoViews.delete(mount)
}
