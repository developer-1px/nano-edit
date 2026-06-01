import { nanoSpecialSearch } from './special'
import {
  activeSearchClauses,
  addSpecialSearch,
  addTagSearch,
  addTermSearch,
  emptySearchClause,
  hasSearchTerms,
} from './query-add'
import {
  nanoSearchTag,
  searchQueryTokens,
} from './query-token'
import type { NanoSpecialSearch } from '../document-index/types'
import type {
  ParsedNanoSearchClause,
  ParsedNanoSearchQuery,
} from './types'

export function parseNanoSearchQuery(query: string): ParsedNanoSearchQuery | null {
  const normalized = query.trim()
  if (!normalized) return null

  const filters: NanoSpecialSearch[] = []
  const excludedFilters: NanoSpecialSearch[] = []
  const tags: string[] = []
  const exactTags: string[] = []
  const excludedTags: string[] = []
  const excludedExactTags: string[] = []
  const terms: string[] = []
  const excludedTerms: string[] = []
  const clauses: ParsedNanoSearchClause[] = [emptySearchClause()]
  for (const item of searchQueryTokens(normalized)) {
    if (!item.excluded && item.token.toLowerCase() === 'or') {
      clauses.push(emptySearchClause())
      continue
    }

    const special = nanoSpecialSearch(item.token)
    if (special) {
      addSpecialSearch(item.excluded, special, filters, excludedFilters, clauses)
      continue
    }

    const tag = nanoSearchTag(item.token)
    if (tag) {
      addTagSearch(item.excluded, tag, tags, exactTags, excludedTags, excludedExactTags, clauses)
      continue
    }

    addTermSearch(item.excluded, item.token.toLowerCase(), terms, excludedTerms, clauses)
  }

  return hasSearchTerms(filters, excludedFilters, tags, exactTags, excludedTags, excludedExactTags, terms, excludedTerms)
    ? {
      query: normalized,
      clauses: activeSearchClauses(clauses),
      filters,
      excludedFilters,
      tags,
      exactTags,
      excludedTags,
      excludedExactTags,
      terms,
      excludedTerms,
    }
    : null
}
