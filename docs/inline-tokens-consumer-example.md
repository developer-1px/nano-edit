# Inline Tokens Consumer Example

This example shows the intended package-consumer assembly path for detecting and highlighting rich-text entities (hashtags, URLs, wiki note links, footnotes, math) in a host that renders plain text — a Notion-like document, an agent chat surface, or any markdown tooling. It pulls in no editor, no ProseMirror, no zod-crud, and no DOM (the parsers are pure `string -> tokens`).

## Responsibilities

- `inline-tokens`: pure parsers. Given source text (and optionally a caret offset), return structured tokens with `from`/`to` offsets and the raw `token` text.
- Host app: how to render highlights, anchor an autocomplete list, and store/normalize entity data.

## Token shape

All inline-entity tokens share the same positional contract, so a host can treat any span uniformly:

```ts
interface TagToken      { from: number; to: number; token: string; /* + name */ }
interface UrlToken      { from: number; to: number; token: string; href: string; syntax: 'autolink' | 'bare' }
interface NoteLinkToken { from: number; to: number; token: string; target: string; alias?: string }
interface FootnoteToken { from: number; to: number; token: string; name: string }
interface MathToken     { from: number; to: number; token: string; formula: string }
```

`from`/`to` are offsets into the source string; `[from, to)` is the slice to highlight.

## Highlight all entities in a paragraph

```ts
import {
  tagTokensInText,
  externalUrlTokensInText,
  noteLinkTokensInText,
} from 'nano-edit/inline-tokens'

interface EntitySpan {
  kind: 'tag' | 'url' | 'link'
  from: number
  to: number
  label: string
}

export function entitySpans(paragraph: string): EntitySpan[] {
  return [
    ...tagTokensInText(paragraph).map((t) => ({ kind: 'tag' as const, from: t.from, to: t.to, label: t.token })),
    ...externalUrlTokensInText(paragraph).map((u) => ({ kind: 'url' as const, from: u.from, to: u.to, label: u.href })),
    ...noteLinkTokensInText(paragraph).map((l) => ({ kind: 'link' as const, from: l.from, to: l.to, label: l.alias ?? l.target })),
  ].sort((a, b) => a.from - b.from)
}

// Host renders each span: paragraph.slice(span.from, span.to) wrapped per span.kind.
```

## Drive a `#tag` autocomplete from caret position

`tagTokenAt(source, caret)` resolves the tag token under a caret offset. Combine it with `nano-edit/autocomplete` (also dependency-free) to open a suggestion list while typing.

```ts
import { tagTokenAt, normalizeTagName } from 'nano-edit/inline-tokens'
import { createAutocomplete, visibleAutocompleteOptions } from 'nano-edit/autocomplete'

const tags = createAutocomplete({
  options: (_ctx, query) => visibleAutocompleteOptions(knownTags, query),
})

function onCaretMoved(text: string, caret: number) {
  const token = tagTokenAt(text, caret)
  const insideTag = token && caret > token.from && caret <= token.to
  if (insideTag) tags.open(token, text.slice(token.from + 1, caret)) // query = text after '#'
  else tags.close()
}

// Group/dedup tags consistently regardless of how they were typed:
const groupKey = (raw: string) => normalizeTagName(raw)
```

## Notes

- The parsers never touch the DOM. The host owns reading text out of its render surface (for a `contenteditable`, use `element.textContent` so offsets line up with `Range`-based selection helpers).
- All five token types expose `from`/`to`/`token`; footnotes (`footnoteRefAt`) and math (`inlineMathTokenAt`) follow the same shape if the host also highlights `[^ref]` or `$formula$`.
- For `[[note|alias]]`, `noteLinkTokensInText` returns both `target` and optional `alias`; render `alias ?? target` and navigate by `target`.
