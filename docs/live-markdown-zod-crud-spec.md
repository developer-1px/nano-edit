# Live Markdown + zod-crud implementation research

Date: 2026-05-24
Status: specification and technical research only. No implementation in this document.

## Decision

`nano-edit` should target a quiet live Markdown editor: rendered document by default, source marks only where the cursor is actually editing.

The current broad CSS rule shape, `active block -> reveal every inline source token`, is the wrong model. Inline Markdown marks must reveal only around the active inline mark or selected inline range. Block Markdown marks such as `#`, `##`, `>`, `-`, `1.`, and `- [ ]` may reveal for the active text block, but must not push the document text horizontally.

`zod-crud` should remain the headless document engine for schema-validated JSON state, JSON Patch commits, selection snapshots, clipboard payloads, and history. It should not own DOM rendering, ProseMirror decoration policy, Markdown syntax parsing, or visual source-marker display.

## References

- Bear official Markdown help: Bear works with notes as plain text while displaying formatting; Bear says it uses CommonMark and exposes Hide Markdown behavior. https://bear.app/faq/how-to-use-markdown-in-bear/
- Obsidian editing modes: Live Preview hides most Markdown syntax and reveals underlying syntax when the cursor enters formatted content. https://obsidian.md/help/edit-and-read
- Obsidian Live Preview launch note: Live Preview displays Markdown syntax around the cursor. https://obsidian.md/blog/live-preview-update/
- CommonMark 0.31.2: baseline Markdown syntax and conformance examples. https://spec.commonmark.org/0.31.2/
- GFM spec: tables, strikethrough, autolinks, and task list item semantics. https://github.github.com/gfm/
- ProseMirror reference: plugins, transactions, selection, and decorations are the correct public surface for editor-view behavior. https://prosemirror.net/docs/ref/
- micromark: CommonMark/GFM parser with positional/concrete-token emphasis, useful as a future conformance oracle. https://github.com/micromark/micromark
- HyperMD: open-source browser Markdown editor reference for "writing + preview in one surface." https://github.com/laobubu/HyperMD
- MarkText: open-source WYSIWYG Markdown editor reference, not a direct dependency target. https://github.com/marktext/marktext

Local authoritative sources:

- [package.json](/Users/user/Desktop/@interactive-os/nano-edit/package.json)
- [nano-core.ts](/Users/user/Desktop/@interactive-os/nano-edit/src/nano-core.ts)
- [prosemirror-nano.ts](/Users/user/Desktop/@interactive-os/nano-edit/src/prosemirror-nano.ts)
- [nano-selection-core.ts](/Users/user/Desktop/@interactive-os/nano-edit/src/nano-selection-core.ts)
- [zod-crud README](/Users/user/Desktop/@interactive-os/zod-crud/packages/zod-crud/README.md)
- [zod-crud SPEC](/Users/user/Desktop/@interactive-os/zod-crud/packages/zod-crud/SPEC.md)

## Product spec

### Surface states

1. Unfocused editor
   - No Markdown syntax marks are visible.
   - No first-block default active state is visible.
   - No hover-only syntax reveal.

2. Focused editor with collapsed cursor
   - Reveal the block-level source marker only for the block containing the selection head.
   - Reveal inline markers only for inline marks containing or directly adjacent to the cursor.
   - Nested inline marks reveal only their own boundary markers around the edited text.

3. Focused editor with text selection
   - Reveal inline markers for marks intersecting the selected inline range.
   - For multi-block selection, reveal block markers only for touched selected blocks if needed for edit clarity.
   - Do not reveal every inline mark in every selected block unless the selection intersects those mark ranges.

4. Read-like state
   - The document should look like content, not an editor demo.
   - No block handles, cards, visible blue outline, inspector chrome, or decorative controls.

### Inline syntax

Inline reveal is not line-level and not block-level.

Examples:

- Cursor inside `**bold**`: show `**` only around that bold range.
- Cursor inside `_italic_`: show `_` only around that italic range.
- Cursor inside nested `**bold _italic_**`: show the containing markers that the cursor intersects; do not reveal unrelated marks elsewhere in the block.
- Cursor inside `[label](href)`: show link source affordance for that link only.
- Cursor inside `#tag`, `[[note]]`, `$math$`, `[^ref]`, or autolink: reveal the source form only for that token.

Inline marker expansion may slightly affect the local marked range, but must not cause unrelated text in the same block to reveal marks. If possible, prefer overlay/widget marker rendering over width-changing pseudo-elements.

### Block syntax

Block syntax is active-block scoped, not document scoped.

Block markers:

- Heading: `# ` through `###### `
- Quote: `> ` including preserved per-line spacing/depth metadata
- List: `- `, `* `, `+ `, `1. `, `1) `
- Todo: `- [ ] ` or `- [x] `
- Code fence: opening and closing fence only when the code block is active
- Math block fence: only when active
- Table source rows: only when active, and only if table cell editing is intentionally source-like
- Divider/image/attachment/reference source: only when active or selected

Layout invariant:

- Text content x-position must remain stable when block markers appear.
- `#` and `##` must not push the heading text to the right.
- Use a reserved marker lane or absolute-positioned marker overlay on the left side of the block content.
- Marker lane must be quiet: muted color, monospace, no background card, no border decoration.

### Accessibility and clipboard

Visible source markers are editing affordances, not document content.

- Source marker widgets should be `aria-hidden="true"` and `contenteditable="false"` unless the product explicitly enters a source-edit mode.
- Screen readers should receive the rendered document text, not duplicated `**` or `#` punctuation.
- Copy as Markdown must use `nanoMarkdownFromDocument`, not browser text selection.
- Copy as plain/rich text can omit Markdown syntax.
- Partial multi-block copy must not fall back to ambiguous browser default behavior if the user expects Markdown output.

## Current implementation findings

`nano-edit` already has the correct architectural split:

- `NanoDocumentSchema` defines schema-valid document state with Zod.
- `createNanoDocument()` creates a `zod-crud` document with history and extended selection.
- ProseMirror owns DOM selection and editing transactions.
- `createProseMirrorTransactionDispatcher()` converts ProseMirror transactions into Nano JSON Patch commits.
- `zod-crud` records patch, history metadata, and selection snapshot.

The weak points are specific:

1. Patch granularity is too broad.
   - [replaceBlocksPatch](/Users/user/Desktop/@interactive-os/nano-edit/src/nano-selection-core.ts:29) replaces `/blocks` for nearly every document change.
   - This works, but reduces debug readability and makes `zod-crud` selection tracking less useful than it could be.

2. Visual source reveal is currently CSS-driven.
   - `.nano-block-active .nano-md-token` reveals every inline token in the active block.
   - That violates the product spec because inline syntax should reveal only around the cursor/selection.

3. Active block decoration currently follows selection, not editor focus.
   - On initial load, selection can make the first block visually active even before user focus.
   - Product spec requires no visible source marks when the editor is unfocused.

4. Block prefix display can reflow layout.
   - Showing hidden prefix spans inline adds width before heading/list content.
   - Product spec requires stable content position.

## zod-crud contract

Current local dependency:

```json
"zod-crud": "file:../zod-crud/packages/zod-crud"
```

The local package reports version `0.12.0`. `npm view zod-crud` returned `E404` on 2026-05-24, so this should be treated as an unpublished local package dependency for now.

Use only the public package entrypoint:

```ts
import { createJSONDocument } from 'zod-crud'
import type { JSONPatchOperation, SelectionSnap, Pointer } from 'zod-crud'
```

Do not import `zod-crud/src/*`, `zod-crud/dist/*`, `application/*`, `domain/*`, or `foundation/*`.

`zod-crud` responsibilities in this project:

- Validate `NanoDocument` with `NanoDocumentSchema`.
- Apply JSON Patch operations through `doc.commit(...)`.
- Store final `SelectionSnap` in the same history entry as the mutation.
- Coalesce text typing history with `history.mergeLast({ mergeKey })`.
- Restore selection after undo/redo.
- Provide `lastPatch` and history metadata for inspectors/tests.

Not `zod-crud` responsibilities:

- ProseMirror DOM decorations.
- CSS marker reveal.
- Markdown parser internals.
- Browser clipboard API.
- Keyboard shortcut policy.
- Visual block handles or editor chrome.

## Proposed implementation architecture

### 1. Replace CSS-wide reveal with a ProseMirror source reveal plugin

Create a view plugin responsible for source marker decorations.

Suggested shape:

```ts
const sourceRevealPlugin = new Plugin({
  key: sourceRevealPluginKey,
  state: {
    init: () => ({ focused: false }),
    apply: (tr, value) => tr.getMeta(sourceRevealPluginKey) ?? value,
  },
  props: {
    decorations: (state) => sourceRevealDecorations(state, sourceRevealPluginKey.getState(state)),
    handleDOMEvents: {
      focus: (view) => { view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: true })); return false },
      blur: (view) => { view.dispatch(view.state.tr.setMeta(sourceRevealPluginKey, { focused: false })); return false },
    },
  },
})
```

The existing `blockUiDecorations()` can keep fold/collapse decoration work, but source reveal should be separate so "active block" no longer means "show every Markdown token."

### 2. Inline reveal should use widget decorations

Use `Decoration.widget` at mark boundaries instead of `.nano-block-active .nano-md-token::before`.

Reasons:

- Widget decorations are selection-derived and local.
- They can insert visual source tokens at exact ProseMirror positions.
- They avoid needing mark DOM to know selection state.
- They are easier to remove when focus leaves.

For each textblock touched by selection:

1. Collect mark ranges from the ProseMirror node.
2. Filter to ranges that contain the collapsed cursor or intersect the selected inline range.
3. Convert the ProseMirror mark to source marker text.
4. Add an opening widget at `from` and closing widget at `to`.

Source marker text should reuse existing serialization logic where possible:

- Basic marks can use `data-md-open` / `data-md-close` equivalents.
- Link/image markers should use the same close text as `markdownLinkClose`.
- Code marks should use the same backtick length logic as `codeBacktickToken`.
- The data model equivalent is already available through [inlineMark](/Users/user/Desktop/@interactive-os/nano-edit/src/nano-markdown-inline-mark.ts:13).

Widget DOM requirements:

```html
<span class="nano-source-widget" aria-hidden="true" contenteditable="false">**</span>
```

CSS requirements:

- muted color
- monospace
- no background
- no hover behavior
- `user-select: none` unless copy-as-source explicitly needs visible marker selection

### 3. Labelled source tokens need a separate rule

Some marks do not have simple open/close markers:

- `tag`
- `note_link`
- `math`
- `footnote_ref`
- autolink/bare link

For these, the source form is a single logical token. Two viable approaches:

1. Widget overlay approach
   - Hide rendered label while active.
   - Insert a single widget at the token start containing raw source text.
   - Keep the underlying ProseMirror text stable.

2. Decoration class approach
   - Add an inline decoration over the token range.
   - CSS reveals the existing raw child only within that decorated range.
   - This is more dependent on ProseMirror DOM nesting and should be tested in-browser.

Prefer widget overlay for deterministic behavior.

### 4. Block markers should use a marker lane

Do not show block source spans inline before content. Instead, reserve a stable marker lane for all text blocks.

Possible DOM/CSS model:

```css
.nano-document {
  --nano-source-lane: 2.25ch;
}

.nano-heading,
.nano-paragraph,
.nano-list-item,
.nano-todo,
.nano-quote,
.nano-callout {
  position: relative;
}

.nano-block-source-marker {
  position: absolute;
  right: calc(100% + 0.35rem);
  width: var(--nano-source-lane);
  text-align: right;
}
```

Then render source markers as widgets or block node decorations positioned into that lane.

Rules:

- The lane is visually empty when the editor is unfocused.
- Showing a marker changes opacity/content only, not layout.
- The document text column is stable across `focus`, `blur`, cursor moves, and heading conversions.

### 5. zod-crud commit flow remains the same

The canonical mutation path remains:

1. User event changes ProseMirror state.
2. Convert ProseMirror document to `NanoDocument`.
3. Produce JSON Patch operations.
4. Convert ProseMirror selection to `SelectionSnap`.
5. Commit:

```ts
ctx.engine.commit(patch, {
  label,
  origin: 'prosemirror-view',
  mergeKey,
  selection,
})
```

6. For continuous text edits, call:

```ts
ctx.engine.history.mergeLast({ mergeKey })
```

The source reveal plugin should not write to `zod-crud`; it is derived view state. Only actual document edits commit patches.

### 6. Improve patch granularity later

This is not required to fix visual reveal, but it is the right zod-crud-aligned improvement.

Current broad patch:

```ts
[{ op: 'replace', path: '/blocks', value: nextBlocks }]
```

Better patch cases:

- Text-only edit: `replace /blocks/{i}/text`
- Mark-only edit: `replace /blocks/{i}/marks`
- Heading level/style edit: `replace /blocks/{i}/level`, `replace /blocks/{i}/headingStyle`
- Todo toggle: `replace /blocks/{i}/checked`
- Block insert: `add /blocks/{i}`
- Block delete: `remove /blocks/{i}`
- Block move: `move /blocks/{from}` to `/blocks/{to}`
- Multi-block structural rewrite: fallback to `replace /blocks`

Benefits:

- Better history/debug traces.
- Better `zod-crud` pointer tracking.
- Less root-level validation work when schemas allow local patch optimization.
- Easier regression tests for specific editor actions.

## Library research

### Keep

- `zod-crud`: keep as local package dependency until published. It is not on npm registry as of the registry check.
- `zod`: already present and required by `zod-crud`.
- ProseMirror packages: current editor stack is already ProseMirror-based and is the correct place for decorations/selection behavior.
- `lucide`: already present for quiet icons. Do not add new icon systems.

### Add only if needed

- `@playwright/test` devDependency, current npm version checked: `1.60.0`.
  - Use for actual browser regressions: no source marks when unfocused, inline-only reveal, heading marker no layout shift.
  - Strongly recommended before treating the editor surface as stable.

- `micromark` current npm version checked: `4.0.2`.
  - Use as a CommonMark/GFM conformance oracle or eventual parser replacement.
  - It is ESM-only and has concrete token/position orientation, useful for preserving Markdown source choices.

- `micromark-extension-gfm` current npm version checked: `3.0.0`.
  - Needed if micromark is used for tables, task lists, strikethrough, autolinks, and GFM footnotes.

- `mdast-util-from-markdown` current npm version checked: `2.0.3`.
- `mdast-util-gfm` current npm version checked: `3.1.0`.
- `mdast-util-to-markdown` current npm version checked: `2.1.2`.
  - Use if the project wants an AST pipeline instead of direct token parsing.
  - This is a bigger parser architecture change and should not be part of the immediate source-reveal fix.

- `prosemirror-inputrules` current npm version checked: `1.5.1`.
  - Optional replacement for some custom Markdown typing rules.
  - Not recommended until source-preservation edge cases are stable, because current custom handlers preserve local metadata.

- `prosemirror-gapcursor` current npm version checked: `1.4.1`.
- `prosemirror-dropcursor` current npm version checked: `1.8.2`.
  - Optional editor ergonomics only.
  - Not needed for Bear/Live Preview source-marker behavior.

### Do not add for this work

- `@codemirror/lang-markdown`: current npm version checked: `6.5.0`, but adopting it means a second editor model or a rewrite toward CodeMirror/Lezer.
- HyperMD: useful reference, but it is CodeMirror-based and not a drop-in for the current ProseMirror architecture.
- MarkText/Muya: useful product reference, not a dependency target.
- Tailwind CSS: not relevant to source reveal correctness. This task needs fewer view states and precise decorations, not a utility-class rewrite.
- `prosemirror-history`: avoid. `zod-crud` is already the history source of truth.

## Test spec

Minimum regression tests before implementation is considered correct:

1. Unfocused quiet surface
   - Load editor.
   - Assert no visible `#`, `**`, list source marker, or source-token raw child is displayed due to initial selection.

2. Inline-only reveal
   - Document contains one paragraph with two bold ranges.
   - Place cursor in first bold range.
   - Assert only first bold range shows `**`.
   - Assert second bold range remains quiet.

3. Block marker no layout shift
   - Measure heading text left coordinate before focus.
   - Focus heading.
   - Assert heading text left coordinate changes by <= 1 px.
   - Assert marker is visible in marker lane.

4. List/todo marker reveal
   - Focus bullet, ordered list, and todo blocks.
   - Assert marker lane shows `-`, `1.`, and `- [ ]` / `- [x]`.
   - Assert checkbox visual remains aligned and clickable.

5. Focus/blur behavior
   - Focus a marked inline token; marker appears.
   - Blur editor; marker disappears.

6. Copy behavior
   - Inline copy returns Markdown for same-parent selection.
   - Whole block copy returns Markdown via serializer.
   - Partial multi-block copy has an explicit policy and test; it must not rely on accidental browser DOM text.

7. zod-crud history
   - Type continuously in one text path; history coalesces through `mergeLast`.
   - Undo restores document and selection.
   - Redo restores document and selection.

## Phased plan

Phase 1: Spec-correct source reveal

- Remove broad inline reveal from `.nano-block-active`.
- Add source reveal ProseMirror plugin.
- Gate source reveal on editor focus.
- Render inline markers with widget decorations.
- Move block markers into stable marker lane.
- Add browser regression tests for no layout shift and inline-only reveal.

Phase 2: Source token consistency

- Define raw-source display for tag, note link, math, footnote ref, autolink, image links.
- Ensure Backspace/Delete/typing behavior at token boundaries maps to actual document edits.
- Make copy behavior explicit for partial multi-block selection.

Phase 3: zod-crud patch granularity

- Replace `/blocks` root replacement with narrower JSON Patch where safe.
- Keep fallback for complex document rewrites.
- Add tests proving selection restoration works with narrow patches and undo/redo.

Phase 4: Parser conformance decision

- Keep current custom Markdown parser if source preservation remains more important than spec breadth.
- Add micromark/GFM as test oracle first.
- Only migrate parser internals after round-trip/source metadata parity is proven.

## Completion criteria

The implementation is correct only when all are true:

- No Markdown source marks are visible before editor focus.
- Inline source marks reveal only for the cursor/selection-intersecting inline mark.
- Heading/list/todo block markers reveal without moving the text column.
- Hover does not reveal Markdown source.
- zod-crud remains the single document/history/selection persistence engine.
- Browser tests prove the rendered behavior, not just CSS string presence.
- No private zod-crud subpath imports are introduced.
