import type { NanoBlock } from '../../core/nano-core'
import { blockMathFormula } from '../../core/nano-math'
import { nextMarkdownBlockId } from './nano-markdown-state'
import type { MarkdownParseState } from './nano-markdown-types'

export function parseMathBlock(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const line = lines[index]!.trim()
  const singleLine = /^\$\$(.+)\$\$$/.exec(line)
  if (singleLine) {
    return {
      block: { id: nextMarkdownBlockId(state), type: 'math', text: blockMathFormula(singleLine[1] ?? ''), mathStyle: 'single' },
      nextIndex: index + 1,
    }
  }

  if (line !== '$$') return null

  const content: string[] = []
  let nextIndex = index + 1
  while (nextIndex < lines.length) {
    if (lines[nextIndex]!.trim() === '$$') {
      nextIndex += 1
      break
    }
    content.push(lines[nextIndex]!)
    nextIndex += 1
  }

  return {
    block: { id: nextMarkdownBlockId(state), type: 'math', text: blockMathFormula(content.join('\n')) },
    nextIndex,
  }
}

export function isMathBlockLine(line: string): boolean {
  return /^\$\$(?:.*\$\$)?$/.test(line.trim())
}
