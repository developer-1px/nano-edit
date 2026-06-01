import { noteLinkTarget } from '../../core/nano-note-link'
import { normalizeTagName } from '../../core/nano-tag'

export interface TagReferenceTarget {
  tag: string
  originBlockId: string | null
}

export interface NoteReferenceTarget {
  target: string
  originBlockId: string | null
}

export function noteReferenceTargetFromEventTarget(target: EventTarget | null): NoteReferenceTarget | null {
  const element = target instanceof Element
    ? target.closest<HTMLElement>('.nano-note-link, .nano-raw-note-link')
    : null
  if (!element) return null

  const resolvedTarget = noteLinkTarget(
    element.dataset.target
      ?? element.dataset.noteLink
      ?? element.textContent?.replace(/^\[\[|\]\]$/g, '')
      ?? '',
  )
  if (!resolvedTarget) return null

  return {
    target: resolvedTarget,
    originBlockId: element.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id ?? null,
  }
}

export function tagReferenceTargetFromEventTarget(target: EventTarget | null): TagReferenceTarget | null {
  const element = target instanceof Element
    ? target.closest<HTMLElement>('.nano-tag, .nano-raw-tag')
    : null
  if (!element) return null

  const tag = normalizeTagReferenceTarget(
    element.dataset.tag
      ?? element.textContent?.replace(/^#/, '')
      ?? '',
  )
  if (!tag) return null

  return {
    tag,
    originBlockId: element.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id ?? null,
  }
}

export function normalizeTagReferenceTarget(tag: string): string {
  return normalizeTagName(tag)
}
