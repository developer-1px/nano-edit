import type { NanoBlock } from '../../core/nano-core'
import { footnoteLabel } from '../../core/nano-footnote'
import {
  blockMarks,
  externalLinkLabel,
  markedText,
} from './labels'
import { pushTagIndexEntries } from './raw'
import { pushNoteLinkIndexEntry } from './references'
import type { NanoDocumentIndexState } from './state'

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
