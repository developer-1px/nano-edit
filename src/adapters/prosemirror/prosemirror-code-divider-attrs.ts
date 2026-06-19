import {
  codeFenceIndent,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
  codeFenceToken,
  mathStyle,
} from '../../codecs/markdown/nano-markdown-code-utils'
import {
  dividerMarkdown,
  dividerMarker,
  dividerMarkerLength,
} from '../../codecs/markdown/nano-markdown-marker-attrs'

export {
  codeFenceIndent,
  codeFenceInfoSpacing,
  codeFenceLength,
  codeFenceMarker,
  mathStyle,
  dividerMarkdown,
  dividerMarker,
  dividerMarkerLength,
}

export function codeFenceOpenToken(
  language: unknown,
  marker: unknown,
  length: unknown,
  indent: unknown,
  infoSpacing: unknown,
): string {
  const info = typeof language === 'string' ? language : ''
  const spacing = info ? codeFenceInfoSpacing(infoSpacing) : ''
  return `${codeFenceIndent(indent)}${codeFenceToken(marker, length)}${spacing}${info}`
}

export function codeFenceCloseToken(marker: unknown, length: unknown, indent: unknown): string {
  return `${codeFenceIndent(indent)}${codeFenceToken(marker, length)}`
}
