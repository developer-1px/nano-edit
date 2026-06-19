import type { NanoBlock, NanoMark } from '../../entities/document/nano-document-model'
import type { BulletMarker, CheckedMarker } from '../../assembly/capability'
import {
  markdownIndentLevel,
  markdownIndentText,
} from '../../codecs/markdown/nano-markdown-list-attrs'
import {
  bulletMarker,
  checkedMarker,
} from '../../codecs/markdown/nano-markdown-marker-attrs'

type TodoBlock = Extract<NanoBlock, { type: 'todo' }>

interface MarkdownTodoLine {
  attrs: {
    checked: boolean
    checkedMarker?: CheckedMarker
    indent?: number
    indentText?: string
    marker?: BulletMarker
  }
  defaultContinuationIndent: string
  indentText: string
  text: string
  type: 'todo'
}

interface MarkdownTodoBlockHelpers {
  inlineMarkdown: (text: string, marks: readonly NanoMark[]) => string
  listContinuationDefaultIndent: (marker: string) => string
  listContinuationIndent: (indent: string | undefined, defaultIndent: string) => string
  markdownListIndent: (block: TodoBlock) => string
}

export function markdownTodoLine(line: string): MarkdownTodoLine | null {
  const todo = /^([ \t]*)([-*+])\s+\[([ xX])\](?:\s+(.*))?$/.exec(line)
  if (!todo) return null

  const indent = todo[1] ?? ''
  const marker = bulletMarker(todo[2])
  const rawCheckedMarker = todo[3] ?? ' '
  const checked = rawCheckedMarker.toLowerCase() === 'x'
  const checkedMarkerValue = checkedMarker(rawCheckedMarker)
  return {
    type: 'todo',
    text: todo[4] ?? '',
    indentText: indent,
    defaultContinuationIndent: `${indent}${' '.repeat(`${marker} [${checked ? checkedMarkerValue : ' '}] `.length)}`,
    attrs: {
      checked,
      indent: markdownIndentLevel(indent),
      indentText: markdownIndentText(indent),
      marker,
      checkedMarker: checkedMarkerValue,
    },
  }
}

export function markdownTodoBlock(
  block: TodoBlock,
  helpers: MarkdownTodoBlockHelpers,
): string {
  const marker = `${helpers.markdownListIndent(block)}${bulletMarker(block.marker)} [${block.checked ? checkedMarker(block.checkedMarker) : ' '}]`
  const continuationIndent = helpers.listContinuationDefaultIndent(marker)
  const lines = helpers.inlineMarkdown(block.text, block.marks).split('\n')
  const firstLine = lines[0] ?? ''
  return [
    firstLine ? `${marker} ${firstLine}` : marker,
    ...lines.slice(1).map((line, index) => `${helpers.listContinuationIndent(block.continuationIndents?.[index], continuationIndent)}${line}`),
  ].join('\n')
}
