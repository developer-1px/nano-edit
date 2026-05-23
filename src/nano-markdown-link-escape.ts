export function needsAngleMarkdownDestination(href: string): boolean {
  return href === '' || /[\s<>]/.test(href) || !hasBalancedParentheses(href)
}

export function hasBalancedParentheses(source: string): boolean {
  let depth = 0
  for (const char of source) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

export function isBackslashEscaped(source: string, index: number): boolean {
  let count = 0
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) count += 1
  return count % 2 === 1
}

export function escapeMarkdownAngleDestination(href: string): string {
  return href.replace(/([\\>])/g, '\\$1')
}

export function unescapeMarkdownImageTitle(text: string): string {
  return text.replace(/\\([\\"])/g, '$1')
}

export function unescapeMarkdownLinkDestination(text: string): string {
  return text.replace(/\\([\\()<> ])/g, '$1')
}
