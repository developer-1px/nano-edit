import {
  normalizeNoteTarget,
  noteTargetFromLabel,
} from './labels'
import type { NanoDocumentIndexState } from './state'

export function resolveDocumentBacklinks(state: NanoDocumentIndexState): void {
  for (const noteLink of state.noteLinks) {
    const target = noteTargetFromLabel(noteLink.target ?? noteLink.label)
    const targetBlockId = target ? state.headingTargets.get(normalizeNoteTarget(target)) : null
    if (targetBlockId) {
      state.backlinks.push({
        blockId: noteLink.blockId,
        targetBlockId,
        label: `${state.blockLabels.get(noteLink.blockId) ?? noteLink.blockId} -> ${target}`,
      })
    } else if (target) {
      state.missingNoteLinks.push(noteLink)
    }
  }
}
