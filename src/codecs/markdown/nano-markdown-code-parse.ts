import type { NanoBlock } from '../../core/nano-core'
import { nextMarkdownBlockId } from './nano-markdown-state'
import type { MarkdownParseState } from './nano-markdown-types'
import {
  codeFenceInfo,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
  type CodeFenceOpener,
} from './nano-markdown-code-utils'

export function parseFencedCode(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const opener = codeFenceOpener(lines[index]!)
  if (!opener) return null

  const content: string[] = []
  let nextIndex = index + 1
  while (nextIndex < lines.length) {
    if (isClosingCodeFence(lines[nextIndex]!, opener.fence)) {
      nextIndex += 1
      break
    }
    content.push(lines[nextIndex]!)
    nextIndex += 1
  }

  return {
    block: {
      id: nextMarkdownBlockId(state),
      type: 'code',
      text: content.join('\n'),
      ...(opener.info ? { language: opener.info } : {}),
      ...(opener.indent ? { fenceIndent: opener.indent } : {}),
      ...(opener.infoSpacing ? { fenceInfoSpacing: opener.infoSpacing } : {}),
      ...(opener.marker !== '`' ? { fenceMarker: opener.marker } : {}),
      ...(opener.length !== 3 ? { fenceLength: opener.length } : {}),
    },
    nextIndex,
  }
}

export function isFencedCodeLine(line: string): boolean {
  return codeFenceOpener(line) !== null
}

function codeFenceOpener(line: string): CodeFenceOpener | null {
  const match = /^([ \t]*)(```+|~~~+)([ \t]*)(.*?)\s*$/.exec(line)
  if (!match) return null

  const indent = match[1]!
  const fence = match[2]!
  const marker = codeFenceMarker(fence[0])
  const info = codeFenceInfo(match[4] ?? '')
  if (info?.includes(marker)) return null

  const infoSpacing = info ? codeFenceInfoSpacing(match[3]) : null
  return {
    fence,
    marker,
    length: codeFenceLength(fence.length),
    ...(indent ? { indent } : {}),
    ...(info ? { info } : {}),
    ...(infoSpacing ? { infoSpacing } : {}),
  }
}

function isClosingCodeFence(line: string, opener: string): boolean {
  const trimmed = line.trim()
  const marker = opener[0]!
  if (!trimmed.startsWith(opener)) return false
  return [...trimmed].every((char) => char === marker)
}
