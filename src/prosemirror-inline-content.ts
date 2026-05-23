import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoMark } from './nano-core'
import { prosemirrorMarkFromNanoMark } from './prosemirror-mark-codec-registry'
import { nanoSchema } from './prosemirror-schema'

export function inlineContentFromText(text: string, marks: readonly NanoMark[]): ProseMirrorNode[] | null {
  if (!text) return null

  const boundaries = new Set([0, text.length])
  for (const mark of marks) {
    const from = clamp(mark.from, 0, text.length)
    const to = clamp(mark.to, from, text.length)
    if (from < to) {
      boundaries.add(from)
      boundaries.add(to)
    }
  }

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b)
  const nodes: ProseMirrorNode[] = []
  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const from = sortedBoundaries[index]!
    const to = sortedBoundaries[index + 1]!
    if (from === to) continue

    const activeMarks = marks
      .filter((mark) => mark.from <= from && mark.to >= to)
      .map(prosemirrorMarkFromNanoMark)
      .filter((mark): mark is Mark => mark !== null)

    nodes.push(nanoSchema.text(text.slice(from, to), activeMarks))
  }

  return nodes
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
