import type { NanoSpecialSearch } from '../document-index/types'

export interface ParsedNanoSearchQuery {
  query: string
  clauses: ParsedNanoSearchClause[]
  filters: NanoSpecialSearch[]
  excludedFilters: NanoSpecialSearch[]
  tags: string[]
  exactTags: string[]
  excludedTags: string[]
  excludedExactTags: string[]
  terms: string[]
  excludedTerms: string[]
}

export interface ParsedNanoSearchClause {
  filters: NanoSpecialSearch[]
  tags: string[]
  exactTags: string[]
  terms: string[]
}
