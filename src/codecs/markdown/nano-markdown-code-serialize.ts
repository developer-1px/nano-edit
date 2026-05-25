import {
  codeFenceIndent,
  codeFenceInfo,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
  longestFenceMarkerRun,
} from './nano-markdown-code-utils'

export function mathBlock(text: string, mathStyle?: unknown): string {
  return mathStyle === 'single' && text && !/[\r\n]/.test(text)
    ? `$$${text}$$`
    : `$$\n${text}\n$$`
}

export function fencedCode(
  text: string,
  language: string | undefined,
  marker: unknown,
  length: unknown,
  indent: unknown,
  infoSpacing: unknown,
): string {
  const fenceMarker = codeFenceMarker(marker)
  const fence = fenceMarker.repeat(Math.max(codeFenceLength(length), longestFenceMarkerRun(text, fenceMarker) + 1))
  const fenceIndent = codeFenceIndent(indent)
  const info = codeFenceInfo(language) ?? ''
  const spacing = info ? codeFenceInfoSpacing(infoSpacing) : ''
  return `${fenceIndent}${fence}${spacing}${info}\n${text}\n${fenceIndent}${fence}`
}
