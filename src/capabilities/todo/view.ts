import type { Node as ProseMirrorNode, NodeType } from 'prosemirror-model'
import type { BlockTemplate } from '../../assembly/capability'

type TodoTemplate = Extract<BlockTemplate, { type: 'todo' }>

export function todoTemplateMarkdownLine(template: TodoTemplate, text: string): string {
  return markdownMarkedLine(
    `${markdownIndent(template.indent, template.indentText)}${markdownBulletMarker(template.marker)} [${template.checked ? markdownCheckedMarker(template.checkedMarker) : ' '}]`,
    text,
  )
}

export function todoNodeForBlockTemplate(
  template: TodoTemplate,
  nextId: string,
  todoType: NodeType,
): ProseMirrorNode {
  return todoType.create({
    id: nextId,
    checked: false,
    indent: markdownIndentLevelForTemplate(template.indent),
    indentText: indentText(template.indentText),
    marker: markdownBulletMarker(template.marker),
    checkedMarker: markdownCheckedMarker(template.checkedMarker),
  })
}

export function continuationTodoNodeAfterParentEnd(
  source: ProseMirrorNode,
  id: string,
  indent: number,
): ProseMirrorNode {
  return source.type.create({
    id,
    checked: false,
    indent,
    indentText: indentText(source.attrs.indentText),
    marker: markdownBulletMarker(source.attrs.marker),
    checkedMarker: markdownCheckedMarker(source.attrs.checkedMarker),
  })
}

export function todoBulletMarkerFromNode(node: ProseMirrorNode): '-' | '*' | '+' {
  return markdownBulletMarker(node.attrs.marker)
}

export function todoCheckedMarkerFromNode(node: ProseMirrorNode): 'x' | 'X' {
  return markdownCheckedMarker(node.attrs.checkedMarker)
}

export function todoSourceMarkerText(node: ProseMirrorNode): string {
  const rawIndent = markdownIndent(node.attrs.indent, node.attrs.indentText)
  const checkedMarker = node.attrs.checked === true ? markdownCheckedMarker(node.attrs.checkedMarker) : ' '
  return `${rawIndent}${markdownBulletMarker(node.attrs.marker)} [${checkedMarker}]`
}

function markdownMarkedLine(marker: string, text: string): string {
  return text ? `${marker} ${text}` : marker
}

function markdownIndent(indent: unknown, rawIndent?: unknown): string {
  return indentText(rawIndent) ?? '  '.repeat(markdownIndentLevelForTemplate(indent))
}

function indentText(indent: unknown): string | null {
  return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null
}

function markdownIndentLevelForTemplate(indent: unknown): number {
  const value = typeof indent === 'number' && Number.isFinite(indent) ? Math.trunc(indent) : 0
  return Math.max(0, Math.min(6, value))
}

function markdownBulletMarker(marker: unknown): '-' | '*' | '+' {
  return marker === '*' || marker === '+' ? marker : '-'
}

function markdownCheckedMarker(marker: unknown): 'x' | 'X' {
  return marker === 'X' ? 'X' : 'x'
}
