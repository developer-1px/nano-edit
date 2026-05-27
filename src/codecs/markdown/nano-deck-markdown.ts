import type { NanoBlock, NanoDocument } from '../../core/nano-core'
import { nanoDocumentFromMarkdown } from './nano-markdown-parse'
import { nanoMarkdownFromDocument } from './nano-markdown-serialize'
import {
  NanoDeckSchema,
  type NanoDeck,
  type NanoDeckMetadata,
  type NanoSlide,
  type NanoSlideRegion,
} from '../../entities/deck/nano-deck'

type ParsedMetadata = Record<string, string | number | boolean>

interface SlideNotesExtraction {
  content: string
  notes: string | null
}

export function nanoDeckFromMarkdown(markdown: string): NanoDeck {
  const lines = normalizedMarkdownLines(markdown)
  const headmatter = readFrontmatter(lines, 0)
  const contentStart = headmatter ? headmatter.nextIndex : 0
  const chunks = slideMarkdownChunks(lines.slice(contentStart))
  const slides = chunks.map((chunk, index) => nanoSlideFromMarkdown(chunk, index))
  const metadata = headmatter?.metadata

  return NanoDeckSchema.parse({
    id: 'deck-1',
    ...(metadata?.title && typeof metadata.title === 'string' ? { title: metadata.title } : {}),
    ...(metadata ? { metadata } : {}),
    slides: slides.length > 0 ? slides : [nanoSlideFromMarkdown('', 0)],
  })
}

export function nanoMarkdownFromDeck(deck: NanoDeck): string {
  const validDeck = NanoDeckSchema.parse(deck)
  const metadataMarkdown = markdownFromDeckMetadata(validDeck)
  const slideMarkdown = validDeck.slides.map(markdownFromSlide).join('\n\n---\n\n')
  return metadataMarkdown ? `${metadataMarkdown}\n\n${slideMarkdown}` : slideMarkdown
}

function nanoSlideFromMarkdown(markdown: string, index: number): NanoSlide {
  const slideId = `slide-${index + 1}`
  const extracted = extractSlideNotes(markdown)
  const contentBlocks = scopedBlocks(
    nanoDocumentFromMarkdown(extracted.content).blocks,
    `${slideId}-content`,
  )
  const regions = slideRegionsFromBlocks(slideId, contentBlocks)

  if (extracted.notes !== null) {
    regions.push({
      id: `${slideId}-notes`,
      kind: 'notes',
      blocks: scopedBlocks(nanoDocumentFromMarkdown(extracted.notes).blocks, `${slideId}-notes`),
    })
  }

  return {
    id: slideId,
    layout: 'default',
    regions,
  }
}

function slideRegionsFromBlocks(slideId: string, blocks: NanoBlock[]): NanoSlideRegion[] {
  const [firstBlock, ...remainingBlocks] = blocks
  if (firstBlock?.type === 'heading') {
    const regions: NanoSlideRegion[] = [{
      id: `${slideId}-title`,
      kind: 'title',
      blocks: [firstBlock],
    }]
    if (remainingBlocks.length > 0) {
      regions.push({
        id: `${slideId}-body`,
        kind: 'body',
        blocks: remainingBlocks,
      })
    }
    return regions
  }

  return [{
    id: `${slideId}-body`,
    kind: 'body',
    blocks,
  }]
}

function markdownFromSlide(slide: NanoSlide): string {
  const visibleRegions = slide.regions.filter((region) => region.kind !== 'notes')
  const notesRegion = slide.regions.find((region) => region.kind === 'notes')
  const parts = visibleRegions.map((region) => nanoMarkdownFromDocument(documentFromBlocks(region.blocks)))

  if (notesRegion) {
    parts.push([
      '::: notes',
      nanoMarkdownFromDocument(documentFromBlocks(notesRegion.blocks)),
      ':::',
    ].join('\n'))
  }

  return parts.filter((part) => part.trim().length > 0).join('\n\n')
}

function documentFromBlocks(blocks: NanoBlock[]): NanoDocument {
  return { blocks }
}

function scopedBlocks(blocks: readonly NanoBlock[], scope: string): NanoBlock[] {
  return blocks.map((block) => ({
    ...block,
    id: `${scope}-${block.id}`,
  }))
}

function slideMarkdownChunks(lines: readonly string[]): string[] {
  const chunks: string[] = []
  let current: string[] = []

  for (const [index, line] of lines.entries()) {
    if (isSlideSeparator(lines, index)) {
      pushChunk(chunks, current)
      current = []
      continue
    }

    current.push(line)
  }

  pushChunk(chunks, current)
  return chunks
}

function pushChunk(chunks: string[], lines: readonly string[]): void {
  const chunk = lines.join('\n').trim()
  if (chunk.length > 0) chunks.push(chunk)
}

function isSlideSeparator(lines: readonly string[], index: number): boolean {
  if (lines[index]?.trim() !== '---') return false

  const previous = lines[index - 1]
  const next = lines[index + 1]
  return (!previous || previous.trim() === '') && (!next || next.trim() === '')
}

function extractSlideNotes(markdown: string): SlideNotesExtraction {
  const lines = normalizedMarkdownLines(markdown)
  const fenced = extractFencedNotes(lines)
  if (fenced) return fenced

  const noteIndex = lines.findIndex((line) => /^notes?:$/i.test(line.trim()))
  if (noteIndex < 0) return { content: markdown.trim(), notes: null }

  return {
    content: lines.slice(0, noteIndex).join('\n').trim(),
    notes: lines.slice(noteIndex + 1).join('\n').trim(),
  }
}

function extractFencedNotes(lines: readonly string[]): SlideNotesExtraction | null {
  const startIndex = lines.findIndex((line) => /^:::\s*(notes|\{\.notes\})\s*$/.test(line.trim()))
  if (startIndex < 0) return null

  const endIndex = lines.findIndex((line, index) => index > startIndex && line.trim() === ':::')
  if (endIndex < 0) return null

  return {
    content: [
      ...lines.slice(0, startIndex),
      ...lines.slice(endIndex + 1),
    ].join('\n').trim(),
    notes: lines.slice(startIndex + 1, endIndex).join('\n').trim(),
  }
}

function markdownFromDeckMetadata(deck: NanoDeck): string | null {
  const metadata: NanoDeckMetadata = {
    ...(deck.metadata ?? {}),
    ...(deck.title ? { title: deck.title } : {}),
  }
  const entries = Object.entries(metadata)
  if (entries.length === 0) return null

  return [
    '---',
    ...entries.map(([key, value]) => `${key}: ${metadataValueMarkdown(value)}`),
    '---',
  ].join('\n')
}

function metadataValueMarkdown(value: string | number | boolean): string {
  if (typeof value !== 'string') return String(value)
  if (/^[A-Za-z0-9_.-]+$/.test(value)) return value
  return JSON.stringify(value)
}

function readFrontmatter(
  lines: readonly string[],
  index: number,
): { metadata: ParsedMetadata; nextIndex: number } | null {
  if (lines[index]?.trim() !== '---') return null

  const closeIndex = lines.findIndex((line, lineIndex) => lineIndex > index && line.trim() === '---')
  if (closeIndex < 0) return null

  const metadata = parseSimpleMetadata(lines.slice(index + 1, closeIndex))
  if (!metadata) return null

  return { metadata, nextIndex: closeIndex + 1 }
}

function parseSimpleMetadata(lines: readonly string[]): ParsedMetadata | null {
  const metadata: ParsedMetadata = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = /^([A-Za-z][\w.-]*):\s*(.*)$/.exec(trimmed)
    if (!match) return null
    metadata[match[1]!] = parseMetadataValue(match[2]!)
  }

  return metadata
}

function parseMetadataValue(source: string): string | number | boolean {
  const trimmed = source.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizedMarkdownLines(markdown: string): string[] {
  return markdown.replace(/\r\n?/g, '\n').split('\n')
}
