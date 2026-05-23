import type { NanoBlock } from './nano-core'
import { blockMarks, indexBlockLabel, indexBlockSearchLabel } from './nano-document-index-labels'
import { tagTokensInText } from './nano-tag'

export function searchableBlockText(block: NanoBlock): string {
  const values = [indexBlockLabel(block), indexBlockSearchLabel(block)]
  if ('text' in block) values.push(block.text)
  if (block.type === 'bookmark') values.push(block.href, block.label ?? '', block.title ?? '')
  if (block.type === 'note_ref') values.push(block.target, block.alias ?? '')
  if (block.type === 'tag_ref') values.push(block.name)
  if (block.type === 'attachment') values.push(block.src, block.label ?? '', block.title ?? '')
  if (block.type === 'image') values.push(block.src, block.alt ?? '', block.title ?? '')
  if (block.type === 'table') values.push(...block.rows.flat())

  for (const mark of blockMarks(block)) {
    if (mark.type === 'tag') values.push(mark.name)
    if (mark.type === 'note_link') values.push(mark.target, mark.alias ?? '')
    if (mark.type === 'math') values.push(mark.formula)
    if (mark.type === 'footnote_ref') values.push(mark.name)
    if (mark.type === 'link') values.push(mark.href, mark.title ?? '')
  }

  return values.filter(Boolean).join(' ')
}

export function blockTagNames(block: NanoBlock): string[] {
  const names: string[] = []
  if (block.type === 'tag_ref') names.push(block.name)
  if (block.type === 'table') {
    for (const row of block.rows) {
      for (const cell of row) {
        names.push(...tagTokensInText(cell).map((tag) => tag.name))
      }
    }
  }
  for (const mark of blockMarks(block)) {
    if (mark.type === 'tag') names.push(mark.name)
  }
  return names
}
