// Pure inline-token parsers: given source text (and optionally an offset),
// detect and normalize rich-text entities — hashtags, URLs, wiki note links,
// footnote refs, and math formulas. No DOM, no ProseMirror, no zod-crud.
// Reusable by any host (Notion-like docs, agent chat, markdown tooling).
export * from '../entities/reference/nano-tag'
export * from '../entities/reference/nano-url'
export * from '../entities/reference/nano-note-link'
export * from '../entities/reference/nano-footnote'
export * from '../entities/math/nano-math'
