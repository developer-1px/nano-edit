import type { NanoDocument } from './nano-core'
import type {
  IndexEntry,
  NanoDocumentIndex,
  NanoSpecialSearch,
} from './nano-document-index-types'
import {
  blockTagNames,
  searchableBlockText,
} from './nano-document-search-block-text'
import {
  normalizeTagName,
  tagMatchesReference,
} from './nano-tag'

export function specialSearchBlockIds(
  filter: NanoSpecialSearch,
  document: NanoDocument,
  index: NanoDocumentIndex,
): ReadonlySet<string> {
  switch (filter) {
    case '@attachments':
      return new Set([
        ...index.attachments.map((entry) => entry.blockId),
        ...index.images.map((entry) => entry.blockId),
      ])
    case '@files':
      return new Set(index.attachments.map((entry) => entry.blockId))
    case '@backlinks':
      return new Set(index.backlinks.flatMap((entry) => blockEntryIds(entry)))
    case '@code':
      return new Set(document.blocks.filter((block) => block.type === 'code').map((block) => block.id))
    case '@done':
      return new Set(index.todos.filter((entry) => entry.checked).map((entry) => entry.blockId))
    case '@images':
      return new Set(index.images.map((entry) => entry.blockId))
    case '@math':
      return new Set(index.math.flatMap((entry) => blockEntryIds(entry)))
    case '@tables':
      return new Set(index.tables.map((entry) => entry.blockId))
    case '@tagged':
      return new Set(document.blocks.filter((block) => blockTagNames(block).length > 0).map((block) => block.id))
    case '@task':
      return new Set(index.todos.map((entry) => entry.blockId))
    case '@title':
      return new Set(document.blocks.filter((block) => block.type === 'heading').map((block) => block.id))
    case '@todo':
      return new Set(index.todos.filter((entry) => !entry.checked).map((entry) => entry.blockId))
    case '@untagged':
      return new Set(document.blocks.filter((block) => blockTagNames(block).length === 0).map((block) => block.id))
    case '@wikilinks':
      return new Set(index.noteLinks.flatMap((entry) => blockEntryIds(entry)))
  }
}

export function tagSearchBlockIds(document: NanoDocument, tag: string, mode: 'exact' | 'tree'): ReadonlySet<string> {
  const target = normalizeTagName(tag).toLowerCase()
  return new Set(document.blocks
    .filter((block) => blockTagNames(block).some((name) => {
      const normalized = normalizeTagName(name).toLowerCase()
      return mode === 'exact'
        ? normalized === target
        : tagMatchesReference(normalized, target)
    }))
    .map((block) => block.id))
}

export function textSearchBlockIds(document: NanoDocument, terms: readonly string[]): ReadonlySet<string> {
  return new Set(document.blocks
    .filter((block) => {
      const text = searchableBlockText(block).toLowerCase()
      return terms.every((term) => text.includes(term))
    })
    .map((block) => block.id))
}

function blockEntryIds(entry: IndexEntry): readonly string[] {
  return entry.blockIds ?? [entry.blockId]
}
