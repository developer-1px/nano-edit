import {
  markdownLinkClose as markdownClose,
  markdownLinkDestinationSource as markdownDestinationSource,
} from '../../codecs/markdown/link/serialize'

export function markdownLinkClose(href: unknown, title: unknown, rawDestinationStyle?: unknown): string {
  const linkHref = String(href ?? '')
  const style = destinationStyle(rawDestinationStyle)
  return markdownClose(linkHref, typeof title === 'string' ? title : undefined, style || undefined)
}

export function linkSyntax(syntax: unknown): 'autolink' | 'bare' | '' {
  return syntax === 'autolink' || syntax === 'bare' ? syntax : ''
}

export function destinationStyle(style: unknown): 'angle' | '' {
  return style === 'angle' ? style : ''
}

export function bookmarkSyntax(syntax: unknown): 'autolink' | 'bare' | 'markdown' {
  return syntax === 'autolink' || syntax === 'markdown' ? syntax : 'bare'
}

export function markdownLinkDestinationSource(href: string, rawDestinationStyle?: unknown): string {
  const style = destinationStyle(rawDestinationStyle)
  return markdownDestinationSource(href, style || undefined)
}
