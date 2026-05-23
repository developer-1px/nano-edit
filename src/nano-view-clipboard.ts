export async function writeClipboardText(text: string): Promise<void> {
  if (globalThis.navigator?.clipboard?.writeText) {
    try {
      await globalThis.navigator.clipboard.writeText(text)
      return
    } catch {
      // Browser clipboard permissions can reject even when the API exists.
      // Fall through to the selection-based copy path.
    }
  }

  writeClipboardTextFromTextarea(text)
}

function writeClipboardTextFromTextarea(text: string): void {
  const textarea = document.createElement('textarea')
  const previousFocus = document.activeElement
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  textarea.style.opacity = '0'
  const mount = document.body ?? document.documentElement
  mount.append(textarea)
  textarea.focus({ preventScroll: true })
  textarea.select()
  try {
    if (!document.execCommand('copy')) {
      throw new Error('Clipboard copy failed')
    }
  } finally {
    textarea.remove()
    restoreFocus(previousFocus)
  }
}

function restoreFocus(element: Element | null): void {
  if (!element || !('focus' in element) || typeof element.focus !== 'function') return
  try {
    element.focus({ preventScroll: true })
  } catch {
    element.focus()
  }
}
