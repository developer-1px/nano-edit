import type { NanoViewOptions } from './context'

const DEFAULT_NANO_EDITOR_ARIA_LABEL = 'Document'

export function createNanoEditorAttributes(options: NanoViewOptions): Record<string, string> {
  return {
    class: 'nano-document',
    role: 'textbox',
    'aria-label': options.ariaLabel?.trim() || DEFAULT_NANO_EDITOR_ARIA_LABEL,
    'aria-multiline': 'true',
    spellcheck: String(options.spellcheck ?? false),
  }
}
