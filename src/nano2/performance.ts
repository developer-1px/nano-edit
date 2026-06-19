import type { NanoDocument } from '../entities/document/nano-document-model'

export interface Nano2PerformanceSnapshot {
  blockCount: number
  textBlockCount: number
  wordCount: number
}

export function nano2PerformanceSnapshot(document: NanoDocument): Nano2PerformanceSnapshot {
  let textBlockCount = 0
  let wordCount = 0

  for (const block of document.blocks) {
    if (!('text' in block) || typeof block.text !== 'string') continue
    textBlockCount += 1
    wordCount += countWords(block.text)
  }

  return {
    blockCount: document.blocks.length,
    textBlockCount,
    wordCount,
  }
}

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}
