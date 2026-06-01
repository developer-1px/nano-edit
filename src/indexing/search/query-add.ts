import type { NanoSpecialSearch } from '../document-index/types'
import type { ParsedNanoSearchClause } from './types'

export function emptySearchClause(): ParsedNanoSearchClause {
  return { filters: [], tags: [], exactTags: [], terms: [] }
}

export function activeSearchClauses(clauses: ParsedNanoSearchClause[]): ParsedNanoSearchClause[] {
  const active = clauses.filter(searchClauseHasPositiveTerms)
  return active.length > 0 ? active : [emptySearchClause()]
}

export function addSpecialSearch(
  excluded: boolean,
  special: NanoSpecialSearch,
  filters: NanoSpecialSearch[],
  excludedFilters: NanoSpecialSearch[],
  clauses: ParsedNanoSearchClause[],
): void {
  if (excluded) {
    pushUnique(excludedFilters, special)
  } else {
    pushUnique(filters, special)
    pushUnique(currentSearchClause(clauses).filters, special)
  }
}

export function addTagSearch(
  excluded: boolean,
  tag: { name: string; exact: boolean },
  tags: string[],
  exactTags: string[],
  excludedTags: string[],
  excludedExactTags: string[],
  clauses: ParsedNanoSearchClause[],
): void {
  if (excluded) {
    pushUnique(tag.exact ? excludedExactTags : excludedTags, tag.name)
  } else {
    pushUnique(tag.exact ? exactTags : tags, tag.name)
    pushUnique(tag.exact ? currentSearchClause(clauses).exactTags : currentSearchClause(clauses).tags, tag.name)
  }
}

export function addTermSearch(
  excluded: boolean,
  term: string,
  terms: string[],
  excludedTerms: string[],
  clauses: ParsedNanoSearchClause[],
): void {
  if (excluded) {
    pushUnique(excludedTerms, term)
  } else {
    pushUnique(terms, term)
    pushUnique(currentSearchClause(clauses).terms, term)
  }
}

export function hasSearchTerms(...groups: readonly unknown[][]): boolean {
  return groups.some((group) => group.length > 0)
}

function currentSearchClause(clauses: ParsedNanoSearchClause[]): ParsedNanoSearchClause {
  return clauses[clauses.length - 1] ?? emptySearchClause()
}

function searchClauseHasPositiveTerms(clause: ParsedNanoSearchClause): boolean {
  return clause.filters.length > 0 || clause.tags.length > 0 || clause.exactTags.length > 0 || clause.terms.length > 0
}

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value)
}
