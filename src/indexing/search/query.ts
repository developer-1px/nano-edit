import { tagNameFromToken } from '../../entities/reference/nano-tag'
import type { NanoSpecialSearch } from '../document-index/types'

interface ParsedNanoSearchQuery {
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

const nanoSpecialSearches = [
  '@attachments',
  '@backlinks',
  '@code',
  '@done',
  '@files',
  '@images',
  '@math',
  '@tables',
  '@tagged',
  '@task',
  '@title',
  '@todo',
  '@untagged',
  '@wikilinks',
] as const

const localizedNanoSpecialSearches: Readonly<Record<string, NanoSpecialSearch>> = {
  '@이미지': '@images',
  '@파일': '@files',
  '@첨부파일': '@attachments',
  '@작업': '@task',
  '@해야할일': '@todo',
  '@완료': '@done',
  '@코드': '@code',
  '@제목': '@title',
  '@태그있음': '@tagged',
  '@태그없음': '@untagged',
  '@위키링크': '@wikilinks',
  '@역방향링크': '@backlinks',
  '@@역방향링크': '@backlinks',
}

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
    if (!item.excluded && !item.quoted && item.token.toLowerCase() === 'or') {
      clauses.push(emptySearchClause())
      continue
    }

    if (item.quoted) {
      addTermSearch(item.excluded, item.token.toLowerCase(), terms, excludedTerms, clauses)
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

function searchQueryTokens(query: string): Array<{ token: string; excluded: boolean; quoted: boolean }> {
  return (query.match(/-?"[^"]+"|\S+/g) ?? [])
    .map((raw) => {
      const excluded = raw.startsWith('-') && raw.length > 1
      const body = excluded ? raw.slice(1) : raw
      const quoted = body.startsWith('"') && body.endsWith('"')
      const token = quoted ? body.slice(1, -1) : body
      return { token: token.trim(), excluded, quoted }
    })
    .filter((item) => item.token)
}

function nanoSpecialSearch(token: string): NanoSpecialSearch | null {
  const normalized = token.toLowerCase()
  const localized = localizedNanoSpecialSearches[normalized]
  if (localized) return localized

  return isNanoSpecialSearch(normalized) ? normalized : null
}

function isNanoSpecialSearch(search: string): search is NanoSpecialSearch {
  return nanoSpecialSearches.some((candidate) => candidate === search)
}

function nanoSearchTag(token: string): { name: string; exact: boolean } | null {
  const exact = token.startsWith('!#')
  const name = exact
    ? tagNameFromToken(token.slice(1))
    : tagNameFromToken(token)
  return name ? { name, exact } : null
}

function emptySearchClause(): ParsedNanoSearchClause {
  return { filters: [], tags: [], exactTags: [], terms: [] }
}

function activeSearchClauses(clauses: ParsedNanoSearchClause[]): ParsedNanoSearchClause[] {
  const active = clauses.filter(searchClauseHasPositiveTerms)
  return active.length > 0 ? active : [emptySearchClause()]
}

function addSpecialSearch(
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

function addTagSearch(
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

function addTermSearch(
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

function hasSearchTerms(...groups: readonly unknown[][]): boolean {
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
