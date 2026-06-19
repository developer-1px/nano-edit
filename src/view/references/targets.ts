import { noteLinkTarget } from '../../entities/reference/nano-note-link'
import { normalizeTagName } from '../../entities/reference/nano-tag'

interface TagReferenceTarget {
  tag: string
  originBlockId: string | null
}

interface NoteReferenceTarget {
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
    originBlockId: referenceOriginBlockId(element),
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
    originBlockId: referenceOriginBlockId(element),
  }
}

export function normalizeTagReferenceTarget(tag: string): string {
  return normalizeTagName(tag)
}

function referenceOriginBlockId(element: Element): string | null {
  return element.closest<HTMLElement>('.nano-block[data-id]')?.dataset.id ?? null
}
