export function findItalicClose(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === '*' && source[index - 1] !== '*' && source[index + 1] !== '*') return index
  }
  return -1
}

export function findUnderscoreItalicClose(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === '_' && source[index - 1] !== '_' && source[index + 1] !== '_') return index
  }
  return -1
}

export function findUnderlineClose(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === '~' && source[index - 1] !== '~' && source[index + 1] !== '~') return index
  }
  return -1
}
