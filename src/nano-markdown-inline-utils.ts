export function boldMarker(marker: unknown): '**' | '__' {
  return marker === '__' ? '__' : '**'
}

export function italicMarker(marker: unknown): '*' | '_' {
  return marker === '_' ? '_' : '*'
}

export function codeBacktickToken(length: unknown, content = ''): string {
  return '`'.repeat(codeBacktickLength(length, content))
}

export function codeBacktickLength(length: unknown, content = ''): number {
  const value = typeof length === 'number'
    ? length
    : typeof length === 'string'
      ? Number(length)
      : 1
  const requested = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
  return Math.max(requested, longestBacktickRun(content) + 1)
}

function longestBacktickRun(text: string): number {
  let longest = 0
  let current = 0
  for (const char of text) {
    if (char === '`') {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}
