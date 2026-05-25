import type { NanoSpecialSearch } from './nano-document-index-types'

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
  '@읽는시간': '@wikilinks',
  '@역방향링크': '@backlinks',
  '@@역방향링크': '@backlinks',
}

export function nanoSpecialSearch(token: string): NanoSpecialSearch | null {
  const normalized = token.toLowerCase()
  const localized = localizedNanoSpecialSearches[normalized]
  if (localized) return localized

  return (nanoSpecialSearches as readonly string[]).includes(normalized)
    ? normalized as NanoSpecialSearch
    : null
}
