import { footnoteLabel, footnoteRefAt } from '../../core/nano-footnote'
import { inlineMathTokenAt } from '../../core/nano-math'
import { noteLinkLabel } from '../../core/nano-note-link'
import { tagHierarchyDisplayLabels, tagHierarchyLabels, tagTokensInText } from '../../core/nano-tag'
import { externalUrlTokensInText } from '../../core/nano-url'
import { noteLinkDisplayLabel } from './references'
import type { IndexEntry } from './types'

export function indexRawMarkdownText(
  text: string,
  blockId: string,
  index: {
    tags: IndexEntry[]
    noteLinks: IndexEntry[]
    externalLinks: IndexEntry[]
    math: IndexEntry[]
    footnotes: IndexEntry[]
  },
): void {
  const noteLinkPattern = /\[\[([^\]\n\r]+)\]\]/g
  const linkPattern = /\[([^\]\n\r]+)\]\((\S+)(?:\s+"((?:\\.|[^"\\])*)")?\)/g
  const occupiedRanges: Array<{ from: number; to: number }> = []
  for (const match of text.matchAll(noteLinkPattern)) {
    const token = match[0] ?? ''
    const label = noteLinkDisplayLabel(token)
    const target = noteLinkLabel(token)
    if (label && target) index.noteLinks.push({ blockId, label, target })
  }

  for (const match of text.matchAll(linkPattern)) {
    const label = match[1]?.trim()
    const href = match[2]?.trim()
    if (match.index !== undefined) occupiedRanges.push({ from: match.index, to: match.index + (match[0]?.length ?? 0) })
    if (label && href) index.externalLinks.push({ blockId, label, target: href })
  }

  for (const token of externalUrlTokensInText(text)) {
    if (!occupiedRanges.some((range) => token.from < range.to && token.to > range.from)) {
      index.externalLinks.push({ blockId, label: token.href, target: token.href })
    }
  }

  for (const tag of tagTokensInText(text)) {
    pushTagIndexEntries(index.tags, blockId, tag.name)
  }

  for (const math of mathTokensInText(text)) {
    index.math.push({ blockId, label: math.formula })
  }

  for (const footnote of footnoteTokensInText(text)) {
    index.footnotes.push({ blockId, label: footnote.name, target: footnoteLabel(footnote.name) ?? footnote.token })
  }
}

export function pushTagIndexEntries(entries: IndexEntry[], blockId: string, name: string): void {
  const labels = tagHierarchyLabels(name)
  const displayLabels = tagHierarchyDisplayLabels(name)
  for (const [index, label] of labels.entries()) {
    entries.push({ blockId, label: displayLabels[index] ?? label, target: label })
  }
}

function mathTokensInText(text: string): { formula: string }[] {
  const tokens: { formula: string }[] = []
  let index = 0
  while (index < text.length) {
    const math = inlineMathTokenAt(text, index)
    if (math) {
      tokens.push({ formula: math.formula })
      index = math.to
      continue
    }
    index += 1
  }
  return tokens
}

function footnoteTokensInText(text: string): { token: string; name: string }[] {
  const tokens: { token: string; name: string }[] = []
  let index = 0
  while (index < text.length) {
    const footnote = footnoteRefAt(text, index)
    if (footnote) {
      tokens.push({ token: footnote.token, name: footnote.name })
      index = footnote.to
      continue
    }
    index += 1
  }
  return tokens
}
