// Pure inline-token parsers: given source text (and optionally an offset),
// detect and normalize rich-text entities — hashtags, URLs, wiki note links,
// footnote refs, and math formulas. No DOM, no ProseMirror, no json-document.
// Reusable by document surfaces, agent chat, and markdown tooling hosts.
export type { TagToken } from '../entities/reference/nano-tag'
export {
  normalizeTagName,
  tagDisplayLabel,
  tagHierarchyDisplayLabels,
  tagHierarchyLabels,
  tagLabel,
  tagMatchesReference,
  tagNameFromToken,
  tagTokenAt,
  tagTokenEndingAt,
  tagTokensInText,
} from '../entities/reference/nano-tag'

export type { UrlSyntax, UrlToken } from '../entities/reference/nano-url'
export {
  externalUrlTokenAt,
  externalUrlTokenEndingAt,
  externalUrlTokensInText,
  hrefDisplayLabel,
  hrefFileName,
} from '../entities/reference/nano-url'

export type { NoteLinkParts, NoteLinkToken } from '../entities/reference/nano-note-link'
export {
  noteLinkLabel,
  noteLinkNavigationTarget,
  noteLinkParts,
  noteLinkTarget,
  noteLinkTokenAt,
  noteLinkTokensInText,
} from '../entities/reference/nano-note-link'

export type { FootnoteDefinition, FootnoteToken } from '../entities/reference/nano-footnote'
export {
  footnoteDefinition,
  footnoteLabel,
  footnoteName,
  footnoteRefAt,
} from '../entities/reference/nano-footnote'

export type { MathToken } from '../entities/math/nano-math'
export {
  blockMathFormula,
  inlineMathFormula,
  inlineMathTokenAt,
} from '../entities/math/nano-math'
