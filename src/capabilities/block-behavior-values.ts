import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { BulletMarker, CheckedMarker } from '../assembly/capability'

export function headingLevel(node: ProseMirrorNode): number {
  const level = typeof node.attrs.level === 'number' ? node.attrs.level : Number(node.attrs.level)
  return Number.isFinite(level) ? Math.trunc(level) : 1
}

export function markdownIndentLevel(indent: string): number {
  const columns = [...indent].reduce((total, char) => total + (char === '\t' ? 4 : 1), 0)
  return clampIndent(Math.floor(columns / 2))
}

export function markdownIndentText(indent: unknown): string | undefined {
  if (typeof indent !== 'string' || !/^[\t ]+$/.test(indent)) return undefined

  const canonical = '  '.repeat(markdownIndentLevel(indent))
  return indent === canonical ? undefined : indent
}

export function indentText(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

export function bulletMarker(marker: unknown): BulletMarker {
  return marker === '*' || marker === '+' ? marker : '-'
}

export function checkedMarker(marker: unknown): CheckedMarker {
  return marker === 'X' ? 'X' : 'x'
}

export function blockIndent(attrs: Record<string, unknown>): number {
  return clampIndent(typeof attrs.indent === 'number' ? attrs.indent : Number(attrs.indent))
}

export function clampIndent(indent: unknown): number {
  const value = typeof indent === 'number' && Number.isFinite(indent) ? Math.trunc(indent) : 0
  return Math.max(0, Math.min(6, value))
}

export function todoBoxTarget(target: EventTarget | null): Element | null {
  const element = target instanceof Element ? target : null
  return element?.closest('.nano-todo-box') ?? null
}
