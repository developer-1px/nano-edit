import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoMark } from './nano-core'
import { footnoteName } from './nano-footnote'
import { inlineMathFormula } from './nano-math'
import { noteLinkParts } from './nano-note-link'
import { tagNameFromToken } from './nano-tag'
import { externalUrlTokenAt } from './nano-url'
import { linkSyntax } from './prosemirror-atom-dom'
import {
  markKey,
  nanoMarkFromProseMirrorMark,
} from './prosemirror-mark-codec-registry'

export function nanoMarksFromProseMirrorNode(node: ProseMirrorNode): NanoMark[] {
  const marks: NanoMark[] = []
  let offset = 0

  node.forEach((child) => {
    if (!child.isText) return
    const textLength = child.text?.length ?? 0
    for (const mark of child.marks) {
      const nanoMark = nanoMarkFromProseMirrorMark(mark, offset, offset + textLength)
      if (nanoMark) marks.push(nanoMark)
    }
    offset += textLength
  })

  return mergeAdjacentMarks(marks)
    .map((mark) => validRawMarkdownMark(mark, node.textContent))
    .filter((mark): mark is NanoMark => mark !== null)
}

function mergeAdjacentMarks(marks: NanoMark[]): NanoMark[] {
  const sorted = [...marks].sort((a, b) => markKey(a).localeCompare(markKey(b)) || a.from - b.from || a.to - b.to)
  const merged: NanoMark[] = []

  for (const mark of sorted) {
    const previous = merged[merged.length - 1]
    if (previous && sameMarkKind(previous, mark) && previous.to === mark.from) {
      previous.to = mark.to
    } else {
      merged.push({ ...mark })
    }
  }

  return merged.sort((a, b) => a.from - b.from || a.to - b.to || markKey(a).localeCompare(markKey(b)))
}

function validRawMarkdownMark(mark: NanoMark, text: string): NanoMark | null {
  const raw = text.slice(mark.from, mark.to)
  if (mark.type === 'tag') {
    const name = tagNameFromToken(raw)
    return name ? { ...mark, name } : null
  }
  if (mark.type === 'note_link') {
    const parts = noteLinkParts(raw)
    return parts ? { ...mark, target: parts.target, ...(parts.alias ? { alias: parts.alias } : {}) } : null
  }
  if (mark.type === 'math') {
    const formula = inlineMathFormula(raw)
    return formula ? { ...mark, formula } : null
  }
  if (mark.type === 'footnote_ref') {
    const name = footnoteName(raw)
    return name ? { ...mark, name } : null
  }
  if (mark.type === 'link' && linkSyntax(mark.syntax)) {
    const token = externalUrlTokenAt(raw, 0)
    return token && token.to === raw.length
      ? { type: 'link', from: mark.from, to: mark.to, href: token.href, syntax: token.syntax }
      : null
  }
  return mark
}

function sameMarkKind(left: NanoMark, right: NanoMark): boolean {
  return markKey(left) === markKey(right)
}
