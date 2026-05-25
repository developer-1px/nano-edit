import type { DOMOutputSpec } from 'prosemirror-model'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'
import {
  destinationStyle,
  markdownLinkClose,
} from './prosemirror-link-dom'

export function attachmentDomSpec(id: unknown, src: unknown, label: unknown, title: unknown, rawDestinationStyle: unknown): DOMOutputSpec {
  const fileSrc = String(src ?? '')
  const attachmentLabelText = typeof label === 'string' && label ? label : attachmentLabel(fileSrc)
  const attachmentTitle = typeof title === 'string' && title ? title : ''
  const attachmentDestinationStyle = destinationStyle(rawDestinationStyle)
  return [
    'div',
    {
      class: 'nano-block nano-attachment',
      'data-id': id,
      'data-src': fileSrc,
      ...(label ? { 'data-label': label } : {}),
      ...(title ? { 'data-title': title } : {}),
      ...(attachmentDestinationStyle ? { 'data-destination-style': attachmentDestinationStyle } : {}),
    },
    [
      'a',
      { class: 'nano-md-link nano-attachment-link', href: fileSrc, 'data-href': fileSrc, contenteditable: 'false', title: attachmentTitle || fileSrc },
      ['span', { class: 'nano-attachment-icon' }, attachmentIcon(fileSrc)],
      ['span', { class: 'nano-attachment-title' }, attachmentLabelText],
      ...(attachmentTitle ? [' ', ['span', { class: 'nano-attachment-detail' }, attachmentTitle] as DOMOutputSpec] : []),
      ['span', hiddenSourceTokenAttrs('nano-attachment-src'), markdownAttachmentToken(attachmentLabelText, fileSrc, attachmentTitle, attachmentDestinationStyle)],
    ],
  ]
}

function markdownAttachmentToken(label: string, src: string, title: string, rawDestinationStyle?: unknown): string {
  return `[${label}${markdownLinkClose(src, title, rawDestinationStyle)}`
}

function attachmentLabel(src: string): string {
  const clean = src.replace(/[?#].*$/, '').replace(/[/\\]+$/, '')
  return clean.split(/[/\\]/).filter(Boolean).at(-1) ?? src
}

function attachmentIcon(src: string): string {
  const extension = attachmentLabel(src).split('.').at(-1)?.toLowerCase() ?? ''
  if (extension === 'pdf') return 'PDF'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(extension)) return 'IMG'
  if (['zip', 'gz', 'tar', 'rar', '7z'].includes(extension)) return 'ZIP'
  return 'FILE'
}
