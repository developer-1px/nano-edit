export function markdownLinkClose(href: unknown, title: unknown, rawDestinationStyle?: unknown): string {
  const linkHref = String(href ?? '')
  const destination = markdownLinkDestinationSource(linkHref, rawDestinationStyle)
  return typeof title === 'string' && title
    ? `](${destination} "${title.replace(/([\\"])/g, '\\$1')}")`
    : `](${destination})`
}

export function linkSyntax(syntax: unknown): 'autolink' | 'bare' | '' {
  return syntax === 'autolink' || syntax === 'bare' ? syntax : ''
}

export function destinationStyle(style: unknown): 'angle' | '' {
  return style === 'angle' ? style : ''
}

export function mathStyle(style: unknown): 'single' | '' {
  return style === 'single' ? style : ''
}

export function bookmarkSyntax(syntax: unknown): 'autolink' | 'bare' | 'markdown' {
  return syntax === 'autolink' || syntax === 'markdown' ? syntax : 'bare'
}

export function markdownLinkDestinationSource(href: string, rawDestinationStyle?: unknown): string {
  return destinationStyle(rawDestinationStyle) === 'angle' || needsAngleMarkdownDestination(href)
    ? `<${href.replace(/([\\>])/g, '\\$1')}>`
    : href
}

function needsAngleMarkdownDestination(href: string): boolean {
  return href === '' || /[\s<>]/.test(href) || !hasBalancedParentheses(href)
}

function hasBalancedParentheses(source: string): boolean {
  let depth = 0
  for (const char of source) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}
