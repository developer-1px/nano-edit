import type { NanoBlock } from '../../core/nano-core'
import {
  escapeMarkdownImageText,
  escapeMarkdownImageTitle,
  markdownLinkDestination,
  markdownLinkDestinationClose,
  markdownLinkDestinationSource,
  markdownLinkLabelClose,
  unescapeMarkdownImageText,
} from './link/index'

export function markdownImage(block: Extract<NanoBlock, { type: 'image' }>): string {
  const alt = escapeMarkdownImageText(block.alt ?? '')
  const title = typeof block.title === 'string' && block.title ? ` "${escapeMarkdownImageTitle(block.title)}"` : ''
  return `![${alt}](${markdownLinkDestinationSource(block.src, block.destinationStyle)}${title})`
}

export function parseMarkdownImage(markdown: string): { alt: string; src: string; destinationStyle?: 'angle'; title?: string } | null {
  if (!markdown.startsWith('![')) return null

  const labelClose = markdownLinkLabelClose(markdown, 2)
  if (labelClose < 0 || markdown[labelClose + 1] !== '(') return null

  const destinationClose = markdownLinkDestinationClose(markdown, labelClose + 2)
  if (destinationClose !== markdown.length - 1) return null

  const destination = markdownLinkDestination(markdown.slice(labelClose + 2, destinationClose))
  if (!destination) return null

  return {
    alt: unescapeMarkdownImageText(markdown.slice(2, labelClose)),
    src: destination.href,
    ...(destination.destinationStyle ? { destinationStyle: destination.destinationStyle } : {}),
    ...(destination.title ? { title: destination.title } : {}),
  }
}
