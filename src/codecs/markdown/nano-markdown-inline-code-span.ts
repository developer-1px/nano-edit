export function markdownCodeSpanAt(source: string, from: number): { backtickLength: number; content: string; to: number } | null {
  const backtickLength = backtickRunLength(source, from)
  if (backtickLength === 0) return null

  let index = from + backtickLength
  while (index < source.length) {
    if (source[index] !== '`') {
      index += 1
      continue
    }

    const closeLength = backtickRunLength(source, index)
    if (closeLength === backtickLength) {
      const content = source.slice(from + backtickLength, index)
      return content.length > 0 ? { backtickLength, content, to: index + closeLength } : null
    }
    index += closeLength
  }

  return null
}

function backtickRunLength(source: string, from: number): number {
  let index = from
  while (source[index] === '`') index += 1
  return index - from
}
