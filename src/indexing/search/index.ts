import { NanoDocumentSchema, type NanoDocument } from '../../core/nano-core'
import { nanoDocumentIndex } from '../document-index/build'
import type { NanoDocumentSearchResult } from '../document-index/types'
import { parseNanoSearchQuery } from './query'
import { searchClauseBlockIds } from './clause'
import {
  subtractBlockIds,
  unionBlockIds,
} from './sets'
import {
  specialSearchBlockIds,
  tagSearchBlockIds,
  textSearchBlockIds,
} from './block-ids'

export function nanoDocumentSearch(document: NanoDocument, query: string): NanoDocumentSearchResult | null {
  const parsed = parseNanoSearchQuery(query)
  if (!parsed) return null

  const validDocument = NanoDocumentSchema.parse(document)
  const index = nanoDocumentIndex(validDocument)
  let matches = parsed.clauses.length > 1
    ? unionBlockIds(parsed.clauses.map((clause) => searchClauseBlockIds(validDocument, index, clause)))
    : searchClauseBlockIds(validDocument, index, parsed.clauses[0])

  for (const filter of parsed.excludedFilters) {
    matches = subtractBlockIds(matches, specialSearchBlockIds(filter, validDocument, index))
  }
  for (const tag of parsed.excludedTags) {
    matches = subtractBlockIds(matches, tagSearchBlockIds(validDocument, tag, 'tree'))
  }
  for (const tag of parsed.excludedExactTags) {
    matches = subtractBlockIds(matches, tagSearchBlockIds(validDocument, tag, 'exact'))
  }
  if (parsed.excludedTerms.length > 0) {
    matches = subtractBlockIds(matches, textSearchBlockIds(validDocument, parsed.excludedTerms))
  }

  return {
    query: parsed.query,
    blockIds: validDocument.blocks.map((block) => block.id).filter((id) => matches.has(id)),
    filters: parsed.filters,
    excludedFilters: parsed.excludedFilters,
    tags: parsed.tags,
    exactTags: parsed.exactTags,
    excludedTags: parsed.excludedTags,
    excludedExactTags: parsed.excludedExactTags,
    terms: parsed.terms,
    excludedTerms: parsed.excludedTerms,
  }
}
