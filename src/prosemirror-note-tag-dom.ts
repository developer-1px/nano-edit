import type { DOMOutputSpec } from 'prosemirror-model'
import { normalizeTagName, tagDisplayLabel } from './nano-tag'
import { sourceTokenAttrs } from './prosemirror-source-token'

export function noteLinkTitle(target: unknown, alias: unknown): string {
  const value = String(target ?? '')
  return typeof alias === 'string' && alias ? `[[${value}|${alias}]]` : `[[${value}]]`
}

export function noteRefDomSpec(id: unknown, target: unknown, alias: unknown): DOMOutputSpec {
  const rawTarget = String(target ?? '')
  const rawAlias = typeof alias === 'string' && alias ? alias : ''
  const token = noteLinkTitle(rawTarget, rawAlias)
  const label = rawAlias || rawTarget
  return [
    'div',
    {
      class: 'nano-block nano-note-ref',
      'data-id': id,
      'data-target': rawTarget,
      ...(rawAlias ? { 'data-alias': rawAlias } : {}),
    },
    [
      'span',
      {
        class: 'nano-note-link nano-note-ref-card',
        'data-target': rawTarget,
        ...(rawAlias ? { 'data-alias': rawAlias } : {}),
        contenteditable: 'false',
        title: label,
      },
      ['span', { class: 'nano-note-ref-title' }, label],
      ['span', sourceTokenAttrs('nano-note-ref-token', { contenteditable: 'false' }), token],
    ],
  ]
}

export function tagRefDomSpec(id: unknown, name: unknown): DOMOutputSpec {
  const tag = normalizeTagName(String(name ?? ''))
  const label = tagDisplayLabel(tag) ?? ''
  return [
    'div',
    { class: 'nano-block nano-tag-ref', 'data-id': id, 'data-tag': tag },
    [
      'span',
      { class: 'nano-tag nano-tag-ref-card', 'data-tag': tag, contenteditable: 'false', title: label },
      ['span', sourceTokenAttrs('nano-tag-ref-title', { contenteditable: 'false' }), label],
    ],
  ]
}
