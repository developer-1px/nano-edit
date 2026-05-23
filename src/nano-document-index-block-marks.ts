import type { NanoBlock } from './nano-core'
import { footnoteLabel } from './nano-footnote'
import {
  blockMarks,
  externalLinkLabel,
  markedText,
} from './nano-document-index-labels'
import { pushTagIndexEntries } from './nano-document-index-raw'
import { pushNoteLinkIndexEntry } from './nano-document-index-references'
import type { NanoDocumentIndexState } from './nano-document-index-state'

export function indexDocumentBlockMarks(state: NanoDocumentIndexState, block: NanoBlock): void {
  for (const mark of blockMarks(block)) {
    if (mark.type === 'tag') pushTagIndexEntries(state.tags, block.id, mark.name)
    if (mark.type === 'note_link') pushNoteLinkIndexEntry(state.noteLinks, block, mark)
    if (mark.type === 'link') {
      const label = markedText(block, mark) || mark.href
      state.externalLinks.push({ blockId: block.id, label: externalLinkLabel(label, mark), target: mark.href })
    }
    if (mark.type === 'math') {
      state.math.push({ blockId: block.id, label: mark.formula })
    }
    if (mark.type === 'footnote_ref') {
      state.footnotes.push({
        blockId: block.id,
        label: mark.name,
        target: footnoteLabel(mark.name) ?? `[^${mark.name}]`,
      })
    }
  }
}
