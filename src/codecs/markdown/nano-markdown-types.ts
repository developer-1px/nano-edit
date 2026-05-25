export interface MarkdownParseState {
  nextId: number
}

export type CalloutTone = 'note' | 'tip' | 'important' | 'warning' | 'caution'
export type BulletMarker = '-' | '*' | '+'
export type OrderedMarker = '.' | ')'
export type DividerMarker = '---' | '***' | '___'
export type CodeFenceMarker = '`' | '~'
export type CheckedMarker = 'x' | 'X'
export type HeadingStyle = 'atx' | 'setext'
export type SetextMarker = '=' | '-'
export type QuoteMarkerSpacing = 'space' | 'none'
export type QuoteMarkerDepth = number
export type FootnoteTextSpacing = 'space' | 'none'
export type FootnoteContinuationIndent = string
export type ListContinuationIndent = string
