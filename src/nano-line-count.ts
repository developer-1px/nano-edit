export function lineBreakCount(text: string): number {
  return [...text].filter((char) => char === '\n').length
}

export function lineCount(text: string): number {
  return lineBreakCount(text) + 1
}
