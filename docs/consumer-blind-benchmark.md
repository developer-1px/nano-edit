# Consumer Blind Benchmark

Date: 2026-05-30

## Purpose

Consumer Blind Benchmark is the repeatable quality gate for Nano Edit's small package seams. It checks whether a package consumer, including an LLM agent, can assemble useful inline editing behavior from exported APIs without copying the demo or reading implementation internals.

The benchmark protects the repo's direction:

- Nano Edit is not one app surface.
- Reusable parts should stay small enough for LLM assembly.
- Core API changes need evidence from repeated consumer friction, not one-off taste.

## Benchmark Rule

A benchmark run gives the agent:

- `docs/package-consumer-contract.md`
- `docs/consumer-blind-benchmark.md`
- output from `pnpm benchmark:consumer-blind:snapshot`
- optionally `docs/inline-api-consumer-example.md` for doc-aware runs

A benchmark run must not give the agent:

- `src/demo/*`
- feature implementation files
- previous agent attempts
- current diff context
- maintainer explanation outside the task text

If the agent needs hidden implementation behavior, the result is not automatically an API failure. Classify it first.

## Failure Taxonomy

- `works-as-is`: the API supports the task cleanly.
- `API missing`: required capability is absent.
- `API awkward`: capability exists, but assembly is indirect, fragile, or easy to misuse.
- `discoverability/name`: capability likely exists, but names or signatures hide the intended use.
- `docs/example gap`: example or contract note would likely solve the issue.
- `task/blind unfairness`: the task asks for information no blind package API should reasonably provide.

## Scoring

| Score | Meaning |
|---:|---|
| 4 | Assembles cleanly from the snapshot; no core change recommended |
| 3 | Assembles with small docs/example gaps; no core change recommended |
| 2 | Assembles, but repeated API awkwardness suggests an extension-level improvement |
| 1 | Cannot assemble without a missing core capability |
| 0 | Task is invalid or unfair under blind conditions |

Promotion rule:

- A single `API awkward` result is a candidate.
- The same `API awkward` or `API missing` result across two distinct tasks is an API improvement target.
- A doc-aware run that reaches score `4` freezes the core for that slice until a new real host creates fresh pressure.

## API Snapshot

Generate the current snapshot with:

```sh
pnpm benchmark:consumer-blind:snapshot
```

The snapshot is intentionally small. It prints package exports and public signatures for:

- `inline-edit`
- `inline-autocomplete`
- `autocomplete`
- `autocomplete-types`
- `markdown`
- `markdown-types`
- `document-index`
- `document-index-types`
- `model`
- `inline-tokens`

## Package Contract Gate

Before using a benchmark result as package feedback, run:

```sh
pnpm check:public-types
pnpm benchmark:consumer-blind:snapshot
```

The type check verifies consumer-style imports through the package export map. The snapshot records the public signatures visible to a blind consumer.

## Tasks

### Task 1: Chat Inline Editor

Requirement:

A rendered chat message can enter single-line `contenteditable` edit mode. Typing `@` opens mention autocomplete; typing `/` opens slash command autocomplete. ArrowUp/ArrowDown moves the list. Enter inserts the selected mention or command and replaces the trigger/query range. Escape closes suggestions or exits edit. Paste normalizes multi-line text to one line. Undo/redo should work at the feature level with a small local history.

Expected assembly path:

- Use `inline-edit` for selection, single-line text, paste normalization, and history intent.
- Use `inlineAutocompleteMatchFromText` for trigger/query/replacement range.
- Use `replaceInlineAutocompleteText` for insertion.
- Use `createAutocomplete` for host-rendered list, or `createAutocompleteSurface` if a separate combobox input is acceptable.
- Host owns commit/cancel and local history snapshots.

Pass criteria:

- No direct `surface.input.value` mutation is required.
- Trigger/query replacement is not hand-derived from offsets.
- The result classifies host-owned history as expected, not missing core.

### Task 2: Markdown Inline Token Editor

Requirement:

The host already renders Markdown to DOM and wants small inline edits for link labels and tags without adopting the full Nano editor. Clicking an inline link or tag enters single-line local edit. Commit updates the host model. Typing `#` opens tag suggestions; typing `@` opens person mentions. Paste normalizes to one line. Escape cancels. The suggestion list should be anchored near the inline token, keyboard accessible, and independent of the host Markdown model.

Expected assembly path:

- Use `inline-edit` for text and selection helpers.
- Use `inlineAutocompleteMatchFromText` and `replaceInlineAutocompleteText`.
- Prefer `createAutocomplete` when the host renders an anchored listbox.
- Use `inlineEditTextPositionAtOffset` plus DOM `Range` if caret anchoring is needed.

Pass criteria:

- The agent does not need Nano document or ProseMirror APIs.
- The agent recognizes host model update as host responsibility.
- Any ARIA/listbox rendering concern is classified as host UI or docs, not missing core.

### Task 3: React Component Label Editor

Requirement:

A component property label in a React product builder can be edited inline without mounting the full editor. It needs single-line editing, paste normalization, undo/redo, focus restore after commit/cancel, and autocomplete for variables like `{{user.name}}` and commands like `/uppercase`. The host may use DOM APIs inside a small React adapter.

Expected assembly path:

- Use `contenteditable` through a React ref.
- Use `restoreInlineEditFocus` after React state changes.
- Use `inlineAutocompleteMatchFromText` for `{{` and `/`.
- Insert variable inner text with `replaceInlineAutocompleteText(..., 'user.name', { suffix: '}}' })`.
- Treat transform commands such as uppercase as host behavior unless the task only asks to insert a command token.

Pass criteria:

- React adapter work is not treated as core API failure.
- Paired trigger insertion does not double-insert delimiters.
- Host-owned command behavior is classified correctly.

### Task 4: Table Cell Local Edit

Requirement:

A table cell can be locally edited as single-line plain text without autocomplete. Enter commits. Escape cancels. Paste normalizes to one line. Undo/redo works inside the local edit session. The host updates its table model on commit.

Expected assembly path:

- Use only `inline-edit`.
- Use `inlineEditSingleLineText`, `insertInlineEditText`, `collapseInlineEditSelection`, `inlineEditSelectionOffset`, and history direction helpers.
- Do not use `autocomplete` or `inline-autocomplete`.

Pass criteria:

- The agent can assemble the feature without the full Nano editor.
- It does not require table-specific core APIs.
- It treats host model update as host responsibility.

### Task 5: Markdown Round-Trip & Block Diff

Requirement:

A host receives a Markdown string produced by an LLM and wants to work with it as data only, without mounting an editor and without persistence. It must parse the Markdown into the structured document, serialize back to Markdown to confirm a lossless round-trip, and produce a per-block diff between two generated versions (added / removed / edited) so it can show which blocks changed.

Expected assembly path:

- Use `nano-edit/markdown` only.
- Use `nanoDocumentFromMarkdown` to parse and `nanoMarkdownFromDocument` to round-trip.
- Use `nanoMarkdownBlocksFromDocument` and `NanoMarkdownBlockEntry` for per-block comparison.
- Treat host model storage, UI, and change presentation as host responsibility.

Pass criteria:

- The agent does not need ProseMirror, the full Nano view, or storage APIs.
- It recognizes that the codec is pure data transformation.
- It classifies the structural-diff identity question (how stable `blockId` is across edits) explicitly rather than assuming.

### Task 6: Generated-Document Search

Requirement:

A host has Markdown documents produced by an LLM and an already-parsed document value. Without an editor and without persistence, it must build a searchable index, run keyword search returning which block ids match, and apply tag-scoped or special filters (only headings, only tagged blocks).

Expected assembly path:

- Use `nano-edit/document-index` only.
- Use `nanoDocumentIndex(document)` for the structured index and `nanoDocumentSearch(document, query)` for keyword + special-filter search.
- Map matched `blockIds` back to `index.outline` entries for labels.
- Recognize `NanoSpecialSearch` (`@title`, `@tagged`, `@untagged`, ...) as the special-filter vocabulary encoded in the query string.

Pass criteria:

- The agent does not need ProseMirror, the full Nano view, or storage APIs.
- It does not assume `nanoDocumentSearch` takes a prebuilt index (it takes the document).
- It classifies the query mini-language syntax as a docs gap, not a missing capability.

## Prompt Template

```md
Consumer Blind Nano Edit benchmark.

Use only:
- this task text
- the provided API snapshot
- optional consumer example, if this is a doc-aware run

Do not inspect implementation files, demo files, repo history, or previous attempts.

Return:
1. Assembly sketch
2. Remaining blockers/confusions
3. Failure taxonomy classification for each blocker
4. Score from 0-4
5. Verdict: works-as-is / works with awkwardness / likely API change needed
6. One recommended next action, or "no core API change recommended"
```

## Recording Results

Append benchmark outcomes to `docs/consumer-blind-dogfooding.md` when they produce a new repeated signal. For routine pass runs, record:

- date
- task id
- blind or doc-aware mode
- score
- repeated blocker, if any
- action taken
