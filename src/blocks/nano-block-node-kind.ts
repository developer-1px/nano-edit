import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-nano'

export function blockId(node: ProseMirrorNode): string {
  return typeof node.attrs.id === 'string' ? node.attrs.id : ''
}

export function isListLikeNode(node: ProseMirrorNode): boolean {
  return node.type.name === nanoNodeNames.todo || node.type.name === nanoNodeNames.listItem
}

export function isHeadingNode(node: ProseMirrorNode): boolean {
  return node.type.name === nanoNodeNames.heading
}

export function headingLevel(node: ProseMirrorNode): number {
  const value = typeof node.attrs.level === 'number' ? node.attrs.level : Number(node.attrs.level)
  return Math.max(1, Math.min(6, Number.isFinite(value) ? Math.trunc(value) : 1))
}

export function nodeIndent(node: ProseMirrorNode): number {
  const value = typeof node.attrs.indent === 'number' ? node.attrs.indent : Number(node.attrs.indent)
  return Math.max(0, Math.min(6, Number.isFinite(value) ? Math.trunc(value) : 0))
}

export function nodeOrderedStart(node: ProseMirrorNode): number | null {
  if (node.attrs.start === null || node.attrs.start === undefined || node.attrs.start === '') return null

  const value = typeof node.attrs.start === 'number' ? node.attrs.start : Number(node.attrs.start)
  if (!Number.isFinite(value)) return null

  return Math.max(1, Math.trunc(value))
}

export function nodeOrderedStartText(node: ProseMirrorNode): string | null {
  return orderedStartText(node.attrs.orderedStartText)
}

export function blockPositionById(doc: ProseMirrorNode, id: string): number | null {
  let position: number | null = null
  doc.forEach((node, offset) => {
    if (position !== null) return
    if (node.attrs.id === id) position = offset
  })
  return position
}

function orderedStartText(start: unknown): string | null {
  if (typeof start !== 'string' || !/^\d+$/.test(start)) return null

  const value = Math.max(1, Math.trunc(Number(start)))
  return start === String(value) ? null : start
}
