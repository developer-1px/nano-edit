import type { InspectorMode } from './nano-command-surface'

const INSPECTOR_MODE_STORAGE_KEY = 'nano-edit:inspector-mode'

export function storedInspectorMode(): InspectorMode {
  try {
    const stored = window.localStorage.getItem(INSPECTOR_MODE_STORAGE_KEY)
    return stored === 'pinned' ? stored : 'hidden'
  } catch {
    return 'hidden'
  }
}

export function storeInspectorMode(mode: InspectorMode): void {
  try {
    if (mode === 'pinned') {
      window.localStorage.setItem(INSPECTOR_MODE_STORAGE_KEY, mode)
      return
    }
    window.localStorage.removeItem(INSPECTOR_MODE_STORAGE_KEY)
  } catch {}
}
