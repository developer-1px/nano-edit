# Consumer Blind Dogfooding: Inline APIs

Date: 2026-05-30

Benchmark definition: `docs/consumer-blind-benchmark.md`
Tracking issue: `https://github.com/developer-1px/nano-edit/issues/1`

## Current Status

The identity gate is now contenteditable-specific: Nano Edit's working identity
is Nano Editable, a contenteditable-based editing foundation. Read this log with
`docs/contenteditable-foundation-gate.md`; native `input`, `textarea`, and
`select` lifecycle friction is not core package feedback unless the host is
rebuilding the interaction as a contenteditable surface.

The current package seam is stable enough to hold:

- `inline-edit`: single-line contenteditable DOM edit primitives and history intent detection
- `autocomplete`: headless option state and optional DOM surface
- `inline-autocomplete`: trigger/query/replacement-range extension over inline edit
- `suggestion`: compatibility wrapper over autocomplete naming

The repeated blockers from the first blind pass have been addressed by:

- `inlineAutocompleteMatchFromText(text, offset, triggers)`
- `replaceInlineAutocompleteText(editor, match, optionText, options)`
- `AutocompleteSurface.open(context, query?)`
- `AutocompleteSurface.setQuery(query)`
- `AutocompleteSurface.state()`
- `AutocompleteSurface.selectedOption()`

Do not add another core API for this slice unless a new real host or a new Consumer Blind run produces the same blocker across at least two tasks.

## Purpose

Validate whether a package consumer, represented by blind sub-agents, can assemble useful inline editing features from Nano Edit's exported APIs without reading the repo implementation or demo code.

This is a diagnostic experiment, not a pass/fail implementation contest. A failed assembly attempt must be classified before it becomes API feedback.

## Blind Condition

Agents could see only:

- `package.json` export names
- public-ish type/function signatures for `inline-edit`, `autocomplete`, and `inline-autocomplete`
- one feature requirement
- the failure taxonomy below

Agents were explicitly told not to inspect source, demo code, or repo history. If they needed implementation details, they had to mark that as a docs or discoverability failure.

## Failure Taxonomy

- `works-as-is`: the API already supports the need cleanly.
- `API missing`: the required capability is absent.
- `API awkward`: the capability exists, but composition is unnecessarily indirect or easy to misuse.
- `discoverability/name`: the capability likely exists, but the name/signature does not make its use clear.
- `docs/example gap`: a short example or contract note would likely solve the confusion.
- `task/blind unfairness`: the task asked for something the blind API snapshot could not reasonably communicate.

## Initial Blind Tasks

| Task | Requirement | Verdict |
|---|---|---|
| Chat message inline editor | Single-line contenteditable edit with `@` mentions, `/` commands, paste normalization, local undo/redo, keyboard suggestions | Works with awkwardness |
| Rendered Markdown token editor | Edit inline link labels/tags with `#` tags and `@` mentions, anchored suggestions, host model commit/cancel | Works with awkwardness |
| React component label editor | Inline property label edit with variables like `{{user.name}}`, slash commands, focus restore, local history | Works with awkwardness |

## Findings

### 1. The small primitives are enough

All agents independently found a plausible assembly path using:

- `collapseInlineEditSelection`
- `inlineEditSelectionOffset`
- `inlineEditSingleLineText`
- `isInlineEditLineBreakInput`
- history direction helpers
- `createAutocompleteSurface`
- `inlineAutocompleteContextFromInput`
- `insertInlineAutocompleteText`

This supports the current package direction: `inline-edit`, `autocomplete`, and `inline-autocomplete` can serve as reusable feature pieces without requiring the full Nano app shell.

### 2. Trigger/query/range is the main missing concept

Every agent had to manually infer the same missing step:

```ts
const context = inlineAutocompleteContextFromInput(text, offset, triggers)
const query = text.slice(context.offset + context.trigger.length, offset)
```

They also needed replacement range semantics for cases like:

- `@mi` -> `@Mina `
- `/sum` -> `/summary `
- `{{user` -> `{{user.name}}`

Current classification:

- `API awkward`: query extraction is not represented.
- `docs/example gap`: insertion semantics are unclear.
- `discoverability/name`: `inlineAutocompleteContextFromInput` sounds like it may accept `InputEvent.data`, inserted text, full text, or text before the caret.

Recommended API direction:

```ts
inlineAutocompleteMatchFromText(text, offset, triggers)
// -> { context, query, replaceFrom, replaceTo } | null
```

Then insertion can be explicit:

```ts
replaceInlineAutocompleteText(editor, match, optionText, { suffix: ' ' })
```

### 3. `createAutocompleteSurface` feels input-driven, not inline-driven

Agents could use `createAutocompleteSurface`, but they noticed that it owns an input. Inline contenteditable hosts usually want the editor itself to drive query text and focus.

Observed workaround:

```ts
surface.open(context)
surface.input.value = query
surface.render()
```

Current classification:

- `API awkward`: surface query cannot be set at open time.
- `docs/example gap`: contenteditable-driven surface use is not shown.

Recommended API direction:

```ts
surface.open(context, query?)
surface.setQuery(query)
```

Either one would remove the direct `surface.input.value` mutation.

### 4. `position` has an invisible contract

The provided type says:

```ts
position?: (root: HTMLElement, context: TContext) => void
```

Agents still guessed that `position` might return a `DOMRect`, coordinates, or virtual element. This is not an implementation failure; it is a contract documentation gap.

Current classification:

- `docs/example gap`
- sometimes `discoverability/name`

Recommended doc direction:

Show one example:

```ts
position(root, context) {
  const rect = context.anchor.getBoundingClientRect()
  root.style.position = 'fixed'
  root.style.left = `${rect.left}px`
  root.style.top = `${rect.bottom}px`
}
```

### 5. History is acceptable as host-owned, but must be stated

Agents expected undo/redo helpers to detect intent only, not own a history stack. That is probably the right boundary for a tiny core API, but the blind test shows it must be explicit.

Current classification:

- `works-as-is` for core responsibility.
- `docs/example gap` for consumer assembly.

Recommended doc direction:

State that `inline-edit` does not own history. It provides intent detection and DOM text helpers; the host stores snapshots.

## Diagnosis

The experiment did not reveal a need to turn Nano Edit back into a larger app API. It revealed one missing extension-level concept:

**Inline autocomplete match** = trigger context + query + replacement range.

That concept belongs in `inline-autocomplete`, not in `autocomplete` core and not in app/demo code.

## Recommended Next Actions

1. Add `inlineAutocompleteMatchFromText(text, offset, triggers)` returning `{ context, query, replaceFrom, replaceTo } | null`.
2. Add a replacement helper that consumes that match and inserts the selected text without leaving trigger/query residue.
3. Add `open(context, query?)` or `setQuery(query)` to `AutocompleteSurface`.
4. Add one compact Consumer Blind example for contenteditable inline autocomplete.
5. Re-run the same three blind tasks after those changes and compare whether failures move from `API awkward` to `works-as-is` or `docs/example gap`.

## Loop 2 Implementation Notes

The first three API actions were implemented after this report:

- `inlineAutocompleteMatchFromText(text, offset, triggers)`
- `replaceInlineAutocompleteText(editor, match, optionText, options)`
- `AutocompleteSurface.open(context, query?)`
- `AutocompleteSurface.setQuery(query)`

The remaining check is another Consumer Blind pass against the updated snapshot. The expected improvement is that agents should no longer need to mutate `surface.input.value` or manually derive `query` and replacement ranges from trigger offsets.

## Loop 2 Result

The updated snapshot was tested against the same three blind tasks. The common result remained `works with awkwardness`, but the awkwardness moved:

- No agent repeated the original `query` and replacement-range missing concept as a core API blocker.
- Agents could use `inlineAutocompleteMatchFromText` and `replaceInlineAutocompleteText` to assemble trigger replacement.
- Remaining repeated issues were documentation and example gaps: when to use `createAutocomplete` vs `createAutocompleteSurface`, how `position(root, context)` is meant to work, and who owns history.
- No agent recommended another core API change from the updated snapshot.

The next loop should include `docs/inline-api-consumer-example.md` as consumer-facing context and test whether the remaining issues move from `docs/example gap` to `works-as-is`.

## Loop 3 Result

The updated snapshot plus `docs/inline-api-consumer-example.md` was tested with two blind tasks:

- chat message inline editor with `@` mentions and `/` commands
- React component property label editor with `{{variable}}` and slash command autocomplete

Both agents returned `works-as-is`.

Remaining notes:

- Host ownership of rendering, anchoring, keyboard routing, React state, and local undo snapshots is expected by the current API design.
- One agent still called that host work `API awkward`, but did not recommend a core API change.
- Both agents explicitly said no additional core API change is recommended.

Current conclusion for this slice:

**The `inline-edit` + `autocomplete` + `inline-autocomplete` core/extension seam is stable enough to hold.** Future work should prefer examples, adapters, or host-specific assemblies unless a new real host reveals a repeated API blocker.

## Loop 4 Result: Markdown Codec Seam (new slice)

A new package entry `nano-edit/markdown` was opened to expose the pure Markdown codec (`nanoDocumentFromMarkdown`, `nanoMarkdownFromDocument`, `nanoMarkdownBlocksFromDocument`, `nanoDeckFromMarkdown`, `nanoMarkdownFromDeck`) without pulling ProseMirror or zod-crud. Bundle measurement of the entry's closure confirms **0 prosemirror and 0 zod-crud references** (tree-shaking removes the `createJSONDocument` path; only `zod` schema code remains). This makes "transform/validate Markdown without rendering or storage" a genuinely cuttable feature.

One blind task was run against the snapshot (now including `markdown`):

| Task | Requirement | Blind score | Verdict |
|---|---|---|---|
| Markdown round-trip & block diff | Parse LLM Markdown, round-trip serialize to confirm no loss, then per-block diff between two versions (added/removed/edited). Data-only: no editor, no PM, no storage. | 3 | Works with awkwardness |

### Findings

- **Round-trip and serialize map cleanly.** The agent assembled parse → serialize → idempotency-fixpoint with no friction. The dedicated `nanoMarkdownBlocksFromDocument` + `NanoMarkdownBlockEntry` correctly signalled per-block diff as an intended use case.
- **The diff step is blocked on `NanoMarkdownBlockEntry` shape (blind).** Classified `docs/example gap`: the type is exported but its fields are invisible in the snapshot. Non-blind verification confirms it is `{ blockId: string; markdown: string }` — exactly what the agent guessed, so diffing *is* expressible.
- **`blockId` is a positional counter, not a stable content id (non-blind finding).** Parsing seeds `MarkdownParseState = { nextId: 1 }` and increments per block. This is deterministic (good for round-trip), but **inserting one block shifts every following `blockId`**, so a `blockId`-keyed diff misreads "1 inserted" as "all-below edited". The API gives per-block markdown but no stable identity for reliable structural diff.

### Classification

- `NanoMarkdownBlockEntry` shape → `docs/example gap`.
- Round-trip idempotency contract unstated → `docs/example gap`.
- Stable per-block identity for diffing → `API awkward` **candidate** (single task). Promote to an `API missing` improvement target only if a second distinct Markdown task (e.g. incremental update, merge) reproduces the same blocker.

### Recommended next actions

1. Document `NanoMarkdownBlockEntry` (`{ blockId, markdown }`), the round-trip idempotency guarantee, and a short "diff two Markdown versions per block" example — likely moves the blind score from 3 to 4.
2. Document that `blockId` from a fresh parse is positional, not content-stable; structural diff across edits should match on content/position heuristics, not raw `blockId`.
3. Do **not** add a content-stable id API yet — wait for a second Markdown task to reproduce the blocker (benchmark promotion rule).

## Loop 5 Result: Data-Entry Seams (`document-index` opened, snapshot tooling improved)

A second data entry point `nano-edit/document-index` was opened (pure index/search: `nanoDocumentIndex`, `nanoDocumentSearch`, `nanoDocumentIndexText` + types). Bundle measurement of its closure confirms **0 prosemirror and 0 zod-crud references**.

### Repeated signal found and fixed: the snapshot starved barrel entry points

Running Task 5 (markdown) and Task 6 (document-index) surfaced the *same* blocker across two distinct tasks: the snapshot showed only re-export names for barrel entry points, hiding both **function call signatures** and **type bodies**. This is a benchmark-tooling defect, not a product API defect — a healthy API was losing points to a thin snapshot.

Fixes applied to `scripts/consumer-blind-api-snapshot.mjs` and the codec types:

- The snapshot now follows each barrel's `export ... from './x'` and prints the re-exported `export function` heads (signatures without bodies) under a `### <entry> signatures` section.
- Added `document-index-types` and `markdown-types` to the snapshot file list (mirroring the existing `autocomplete-types` pattern).
- Extracted `NanoMarkdownBlockEntry` into `src/codecs/markdown/types.ts` so the codec exposes a dedicated type module like `document-index` does (serialize re-exports it for compatibility).

### Re-measured scores after the tooling fix

| Task | Before tooling | After tooling | Verdict |
|---|---|---|---|
| Task 6 (document search) | 3 / works-with-awkwardness | 3 / **works-as-is** | signatures clarified `nanoDocumentSearch(document, query)`; remaining friction is query mini-language docs only |
| Task 5 (markdown diff) | 2 / works-with-awkwardness | 3 / works-with-awkwardness | `NanoMarkdownBlockEntry` fields now visible; diff is assemblable |

### Remaining signal: `blockId` content-stability (genuine API candidate)

With the snapshot gap closed, both the blind agent (Task 5) and a non-blind code reading independently land on the same residual: `nanoDocumentFromMarkdown` block ids are positional, not content-stable, so a `blockId`-keyed diff misclassifies inserts/edits. This is the one item that may justify an actual API change (content-hash ids, or a first-class `nanoMarkdownBlockDiff(a, b)` helper). Per the promotion rule, hold until a second distinct task (e.g. incremental merge/update) reproduces it.

### Conclusion for the data-entry slice

`nano-edit/markdown` and `nano-edit/document-index` are genuinely cuttable as pure data features (no prosemirror, no zod-crud). The seams assemble cleanly once the snapshot exposes signatures + type bodies. No core API change is forced today; the next real pressure point, if any, is content-stable block identity for structural diffing.

## Loop 6 Result: `model` opened — pure data model is now cuttable

A third data entry point `nano-edit/model` was opened, exposing only the pure data shape (schemas, inferred types, empty-value factories) and **excluding** the zod-crud document engines (`createNanoDocument`/`createNanoDeck`) and editing-time selection helpers. This was achieved with a barrel alone — **no edit to `entities/document` or `entities/deck`** — because tree-shaking already drops the unused `createJSONDocument` path. Bundle measurement: **0 prosemirror, 0 zod-crud** (zod schema code remains, as required for validation). The earlier assumption that this needed an entities "inversion surgery" was wrong.

This means all three data slices — `markdown`, `document-index`, `model` — are cuttable without the editor (ProseMirror) or persistence (zod-crud) runtimes.

### Task 7 (Schema Validation & Programmatic Construction): 2 / works-as-is

- **Validation** (`NanoDocumentSchema.safeParse(json)`) assembles cleanly.
- **Construction** is blocked: the agent can name the schema and the empty factory but cannot author a valid `NanoBlock`/`NanoSlide` because the type bodies are not visible and `NanoBlock` is a discriminated union.
- All blockers classified as docs gaps; no core API change identified.

### Confirmed improvement target: data entries need type-body visibility

The "type body not visible" blocker has now appeared across **two distinct tasks** (Task 5 markdown, Task 7 model) — this meets the benchmark promotion rule for an improvement target. The fix differs by entry:

- `markdown`, `document-index`: solved by a dedicated `types.ts` (done).
- `model`: the type body *is* the zod schema tree (`z.infer<...>`), so surfacing it means deciding how much of the schema tree (`NanoDocumentSchema`, the `NanoBlock` union variants, `NanoSlideRegionKind` literals) is public contract vs. internal validation detail. This is a design decision, not a mechanical snapshot addition, and is left for maintainer judgment.

### Where the autonomous loop stops

Mechanical, low-risk seam work is now exhausted: three pure-data entry points are open and bundle-verified, the snapshot tool surfaces signatures, and the repeated blockers are recorded. The remaining items are genuine design decisions, not safe mechanical edits:

1. Content-stable `blockId` for structural diffing (Task 5) — API change candidate.
2. How much of the model schema tree to publish as contract (Task 7) — snapshot/docs scope decision.
3. Inverting zod-crud out of `entities` so the `.` root (not just the tree-shaken sub-entries) is zod-crud-optional — larger refactor touching core data files.

## Loop 7 Result: `inline-tokens` opened — pure rich-text entity parsers

A fourth pure-data entry point `nano-edit/inline-tokens` was opened: hashtag / URL / wiki-note-link / footnote / math inline-token parsers, all `source: string` in, structured token out. Bundle measurement: **1.6KB gzip, 0 prosemirror, 0 zod, 0 DOM** — the lightest, most universally reusable slice (Notion-like docs, agent chat highlight, markdown tooling).

### Task 8 (rich-text entity extraction, Notion-style host): 3 / works-with-awkwardness

- Hashtag extraction (`tagTokensInText`), URL extraction (`externalUrlTokensInText`), and tag normalization (`normalizeTagName`) are works-as-is.
- Two findings:
  1. **Token type bodies not visible** (`TagToken`, `UrlToken`, `NoteLinkParts` — their offset fields). This is the same repeated "data-entry needs type-body visibility" signal as Task 5 and Task 7 — now seen across three tasks. Fix: add an `inline-tokens-types` snapshot section / dedicated types module.
  2. **Genuine API asymmetry (new):** `tag` and `url` are first-class (`...TokensInText` batch + `...TokenAt` positional), but wiki-note-links expose only per-string accessors (`noteLinkParts`, `noteLinkLabel`, `noteLinkTarget`) — no `noteLinkTokensInText` / `noteLinkTokenAt`. A host highlighting `[[notes]]` must hand-roll span scanning, defeating the entry point's purpose for that one axis. This is a real missing-capability candidate, independently surfaced by the blind agent.

### Recommended

- Bring note-links to parity: add `noteLinkTokensInText(source)` + `noteLinkTokenAt(source, from)` mirroring the tag/url parsers (small pure additions — completes the `inline-tokens` part).
- Surface the token type bodies (offset field names) so highlight positions are not guessed.

### Follow-up applied (same loop)

Both items above were implemented:

- Added `noteLinkToken` interface + `noteLinkTokenAt(source, from)` and `noteLinkTokensInText(source)` to `entities/reference/nano-note-link.ts`, mirroring the URL parser (`{ from, to, token, target, alias? }`). Wiki-links are now first-class alongside tags and URLs. Bundle stayed at ~1.7KB gzip.
- Extended the snapshot tool (`reexportedFunctionSignatures`) to also surface single-level `export interface` / `export type` bodies behind a barrel, so token offset fields (`TagToken`/`UrlToken`/`NoteLinkToken`) are visible. This resolves the repeated "data-entry type bodies not visible" signal across all data entries at once.

Re-measured **Task 8: 4 / works-as-is** — extract+position for tags/urls/wiki-links, caret-in-tag detection, and tag normalization all map 1:1 onto exported pure DOM-free functions.

Residual resolved: `FootnoteToken`/`MathToken` now also carry `from` (non-breaking additive field — full `pnpm test` stays green). All five `inline-tokens` token types are now uniform `{ from, to, token, ... }`, so a host can treat any entity span identically for highlighting.

## Package Contract Baseline

Issue: `https://github.com/developer-1px/nano-edit/issues/2`

The dogfood package contract is now explicit:

- Root `nano-edit` is the full editor assembly entry. It is for mounting the Nano view or using the full package facade.
- Small host features should start from subpath entries: `inline-edit`, `autocomplete`, `inline-autocomplete`, `markdown`, `document-index`, `model`, and `inline-tokens`.
- `docs/package-consumer-contract.md` records the entry guide, package/host responsibility boundaries, source-export status, and contract gates.
- `package.json` now uses `types`/`default` conditions for public exports and marks the local contract as `0.1.0-dogfood.0`.
- `pnpm check:public-types` compiles a consumer-style fixture through package self-reference imports, proving subpath type resolution without reading implementation files.

The package is still private and still exports source `.ts` files. That is an intentional dogfood baseline, not a publish-ready artifact contract.
