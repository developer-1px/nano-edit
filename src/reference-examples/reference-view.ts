import { nanoDocumentFromMarkdown } from '../codecs/markdown/nano-markdown-parse'
import { createNanoDocument } from '../entities/document/nano-document'
import { createNanoView } from '../view/runtime/create'
import type { NanoViewHandle } from '../view/runtime/types'

export type ReferenceViewHandle = NanoViewHandle

export function createReferenceView(mount: HTMLElement, markdown: string): ReferenceViewHandle {
  const engine = createNanoDocument(nanoDocumentFromMarkdown(markdown))
  return createNanoView({
    mount,
    engine,
  })
}
