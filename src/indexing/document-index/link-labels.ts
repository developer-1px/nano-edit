import type { NanoBlock, NanoMark } from '../../entities/document/nano-document-model'
import { noteLinkNavigationTarget } from '../../entities/reference/nano-note-link'
import { hrefDisplayLabel, hrefFileName } from '../../entities/reference/nano-url'

export function attachmentIndexLabel(block: Extract<NanoBlock, { type: 'attachment' }>): string {
  return block.label ?? hrefFileName(block.src)
}

export function noteTargetFromLabel(label: string): string | null {
  const target = noteLinkNavigationTarget(label)
  return target || null
}

export function normalizeNoteTarget(target: string): string {
  return noteLinkNavigationTarget(target).toLowerCase()
}

export function externalLinkLabel(label: string, mark: Extract<NanoMark, { type: 'link' }>): string {
  return mark.syntax === 'autolink' ? mark.href : label || mark.href
}

export function bookmarkIndexLabel(block: Extract<NanoBlock, { type: 'bookmark' }>): string {
  return block.label ?? hrefDisplayLabel(block.href)
}
