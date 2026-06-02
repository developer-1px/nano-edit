import {
  escapeMarkdownAngleDestination,
  needsAngleMarkdownDestination,
} from './escape'

export function markdownLinkClose(href: string, title: string | undefined, destinationStyle?: 'angle'): string {
  const destination = markdownLinkDestinationSource(href, destinationStyle)
  return typeof title === 'string' && title
    ? `](${destination} "${escapeMarkdownImageTitle(title)}")`
    : `](${destination})`
}

export function markdownLinkDestinationSource(href: string, destinationStyle?: 'angle'): string {
  return destinationStyle === 'angle' || needsAngleMarkdownDestination(href)
    ? `<${escapeMarkdownAngleDestination(href)}>`
    : href
}

export function escapeMarkdownImageText(text: string): string {
  return text.replace(/([\\[\]])/g, '\\$1')
}

export function unescapeMarkdownImageText(text: string): string {
  return text.replace(/\\([\\[\]])/g, '$1')
}

export function escapeMarkdownImageTitle(text: string): string {
  return text.replace(/([\\"])/g, '\\$1')
}
