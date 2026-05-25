import { noteLinkParts } from '../../core/nano-note-link'
import {
  markdownLinkDestination,
  markdownLinkDestinationClose,
  markdownLinkLabelClose,
} from './nano-markdown-link-destination'

export function markdownLinkAt(
  source: string,
  from: number,
): { label: string; href: string; destinationStyle?: 'angle'; title?: string; to: number } | null {
  if (source[from] !== '[' || source[from - 1] === '!') return null

  const labelClose = markdownLinkLabelClose(source, from + 1)
  if (labelClose < 0 || source[labelClose + 1] !== '(') return null

  const destinationClose = markdownLinkDestinationClose(source, labelClose + 2)
  if (destinationClose < 0) return null

  const label = source.slice(from + 1, labelClose)
  const destination = markdownLinkDestination(source.slice(labelClose + 2, destinationClose))
  if (!label.trim() || !destination) return null

  return { label, ...destination, to: destinationClose + 1 }
}

export function markdownNoteLinkAt(source: string, from: number): { token: string; target: string; alias?: string; to: number } | null {
  if (!source.startsWith('[[', from)) return null

  const closeFrom = source.indexOf(']]', from + 2)
  if (closeFrom <= from + 2) return null

  const parts = noteLinkParts(source.slice(from + 2, closeFrom))
  if (!parts) return null

  return {
    token: source.slice(from, closeFrom + 2),
    ...parts,
    to: closeFrom + 2,
  }
}
