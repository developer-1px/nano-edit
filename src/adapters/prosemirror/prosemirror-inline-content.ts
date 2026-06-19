import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'
import type { NanoMark } from '../../entities/document/nano-document-model'
import { prosemirrorMarkFromNanoMark } from './prosemirror-mark-codec-registry'
import { nanoNodeNames } from './prosemirror-names'
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
    const from = sortedBoundaries[index] ?? 0
    const to = sortedBoundaries[index + 1] ?? text.length
    if (from === to) continue

    const activeNanoMarks = marks.filter((mark) => mark.from <= from && mark.to >= to)
    const mention = activeNanoMarks.find((mark): mark is Extract<NanoMark, { type: 'mention' }> => mark.type === 'mention')
    if (mention) {
      nodes.push(nanoSchema.nodes[nanoNodeNames.mention].create({
        id: mention.id,
        label: mentionLabel(mention, text.slice(from, to)),
      }))
      continue
    }

    const activeMarks = activeNanoMarks
      .map(prosemirrorMarkFromNanoMark)
      .filter((mark): mark is Mark => mark !== null)

    nodes.push(...inlineNodesFromText(text.slice(from, to), activeMarks))
  }

  return nodes
}

function inlineNodesFromText(text: string, marks: readonly Mark[]): ProseMirrorNode[] {
  const nodes: ProseMirrorNode[] = []
  const parts = text.split('\n')

  for (const [index, part] of parts.entries()) {
    if (part) nodes.push(nanoSchema.text(part, marks))
    if (index < parts.length - 1) nodes.push(nanoSchema.nodes[nanoNodeNames.hardBreak].create())
  }

  return nodes
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mentionLabel(mark: Extract<NanoMark, { type: 'mention' }>, text: string): string {
  return (mark.label || text.replace(/^@/, '').replace(/\ufffc/g, '') || mark.id).trim()
}
