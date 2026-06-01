import { tagNameFromToken } from '../../core/nano-tag'

export function searchQueryTokens(query: string): Array<{ token: string; excluded: boolean }> {
  return (query.match(/-?"[^"]+"|\S+/g) ?? [])
    .map((raw) => {
      const excluded = raw.startsWith('-') && raw.length > 1
      const body = excluded ? raw.slice(1) : raw
      const token = body.startsWith('"') && body.endsWith('"') ? body.slice(1, -1) : body
      return { token: token.trim(), excluded }
    })
    .filter((item) => item.token)
}

export function nanoSearchTag(token: string): { name: string; exact: boolean } | null {
  const exact = token.startsWith('!#')
  const name = exact
    ? tagNameFromToken(token.slice(1))
    : tagNameFromToken(token)
  return name ? { name, exact } : null
}
