import type { NanoDocument } from './nano-core'
import { nanoDocumentIndex } from './nano-document-index-build'
import type { NanoDocumentSearchResult } from './nano-document-index-types'
import { parseNanoSearchQuery } from './nano-document-search-query'
import { searchClauseBlockIds } from './nano-document-search-clause'
import {
  subtractBlockIds,
  unionBlockIds,
} from './nano-document-search-sets'
import {
  specialSearchBlockIds,
  tagSearchBlockIds,
  textSearchBlockIds,
} from './nano-document-search-block-ids'

export function nanoDocumentSearch(document: NanoDocument, query: string): NanoDocumentSearchResult | null {
  const parsed = parseNanoSearchQuery(query)
  if (!parsed) return null

  const index = nanoDocumentIndex(document)
  let matches = parsed.clauses.length > 1
    ? unionBlockIds(parsed.clauses.map((clause) => searchClauseBlockIds(document, index, clause)))
    : searchClauseBlockIds(document, index, parsed.clauses[0])

  for (const filter of parsed.excludedFilters) {
    matches = subtractBlockIds(matches, specialSearchBlockIds(filter, document, index))
  }
  for (const tag of parsed.excludedTags) {
    matches = subtractBlockIds(matches, tagSearchBlockIds(document, tag, 'tree'))
  }
  for (const tag of parsed.excludedExactTags) {
    matches = subtractBlockIds(matches, tagSearchBlockIds(document, tag, 'exact'))
  }
  if (parsed.excludedTerms.length > 0) {
    matches = subtractBlockIds(matches, textSearchBlockIds(document, parsed.excludedTerms))
  }

  return {
    query: parsed.query,
    blockIds: document.blocks.map((block) => block.id).filter((id) => matches.has(id)),
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
