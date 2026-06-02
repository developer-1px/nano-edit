import type { NanoBlock } from '../../core/nano-core'
import {
  defineMarkdownAtomicBlockCodec,
  type WithoutId,
} from './nano-markdown-atomic-types'
import { markdownNoteLinkAt } from './link/index'

type NoteRefBlock = Extract<NanoBlock, { type: 'note_ref' }>

export const markdownNoteRefCodec = defineMarkdownAtomicBlockCodec({
  type: 'note_ref',
  parse: parseMarkdownNoteRef,
  markdown: markdownNoteRef,
})

function parseMarkdownNoteRef(markdown: string): WithoutId<NoteRefBlock> | null {
  const noteLink = markdownNoteLinkAt(markdown, 0)
  if (!noteLink || noteLink.to !== markdown.length) return null

  return {
    type: 'note_ref',
    target: noteLink.target,
    ...(noteLink.alias ? { alias: noteLink.alias } : {}),
  }
}

function markdownNoteRef(block: NoteRefBlock): string {
  return block.alias ? `[[${block.target}|${block.alias}]]` : `[[${block.target}]]`
}
