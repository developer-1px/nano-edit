import { markdownLinkDestinationSource } from './prosemirror-link-dom'

export function markdownImageToken(alt: unknown, src: unknown, title: unknown, rawDestinationStyle?: unknown): string {
  const label = String(alt ?? '').replace(/([\\[\]])/g, '\\$1')
  const href = String(src ?? '')
  const imageTitle = typeof title === 'string' && title
    ? ` "${title.replace(/([\\"])/g, '\\$1')}"`
    : ''
  return `![${label}](${markdownLinkDestinationSource(href, rawDestinationStyle)}${imageTitle})`
}
