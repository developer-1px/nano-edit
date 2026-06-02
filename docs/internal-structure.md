# Internal Structure

Nano Edit internals should be organized as self-contained modules, not as long prefix-based file lists.

## Module Rule

A folder owns the long context. A file name should state only the local responsibility inside that folder.

Use:

- `view/block-edit/change.ts`
- `view/keyboard/shortcuts.ts`
- `view/runtime/create.ts`

Avoid:

- `view/nano-view-block-change-transactions.ts`
- `view/nano-view-keyboard-shortcuts.ts`
- `view/nano-view-create.ts`

## Boundary Rule

Create or keep a folder when its files share a reason to change:

- same user action lifecycle
- same DOM or focus ownership boundary
- same ProseMirror transaction family
- same source conversion contract
- same runtime wiring responsibility

Do not create a folder only because a file is large or because a helper can be extracted.

## View Map

- `view/runtime`: create, context, lifecycle, shell installation, command runners.
- `view/shell`: command palette and inspector chrome.
- `view/input`: ProseMirror input plugins and DOM event handlers.
- `view/keyboard`: keymap runtime, Enter/Backspace behavior, Markdown shortcut input, inline mark boundaries.
- `view/block-edit`: block insert/change/delete/duplicate/select transactions and replacement context preservation.
- `view/block-move`: block move, indent, drop target, reorder calculations.
- `view/block-template`: block template to ProseMirror node and Markdown marker conversion.
- `view/block-ui`: block decorations and fold indicator DOM behavior.
- `view/markdown-source`: Markdown source panel rows, copy/paste, source replacement, atom source conversion.
- `view/references`: external links, note references, tag references, and index-entry actions.
- `view/inspector`: index panel, Markdown panel, navigation, inspector runtime.
- `view/deck`: multi-document deck surface.
- `view/engine`: ProseMirror dispatch, engine sync, history, collapsed-block pruning.
- `view/clipboard`: clipboard text and DataTransfer helpers.
- `view/list`: shared list transformation helpers.
- `view/index-view`: index-entry view types and labels.
- `view/selection`: active-block and fold-target selection helpers.

Root `view` should stay thin. `nano-view.ts` is the public facade, and `icons.ts` is a shared primitive used by multiple modules.

## Blocks Map

- `blocks/nano-block-options.ts`: public facade and default block option registry.
- `blocks/options`: shared block option internals for templates, keyboard behavior, ProseMirror node creation, and source-preserving value normalizers.
- `blocks/definitions`: individual block option definitions and definition groups.

Keep host-facing block imports stable through `blocks/nano-block-options.ts`. Internal option helpers should live under `blocks/options`; block definitions should live under `blocks/definitions`. File names inside those folders should avoid repeating `nano-block-option`.

## Marks Map

- `marks/nano-mark-options.ts`: public facade for mark commands, queries, shortcuts, and types.
- Other `marks/*` files use local names such as `commands.ts`, `queries.ts`, `shortcuts.ts`, and `types.ts`.

Keep host-facing mark imports stable through `marks/nano-mark-options.ts`; avoid repeating `nano-mark` in internal filenames.

## Commands Map

- `commands/registry.ts`: command composition entry for the view shell.
- `commands/types.ts`: command contracts.
- `commands/actions*.ts`, `commands/blocks.ts`, and `commands/marks.ts`: command families.

Command filenames should not repeat `nano-command`; the command concept is already carried by the folder.

## Indexing Map

- `indexing/nano-document-index.ts`: public facade for document index and search APIs.
- `indexing/document-index`: index construction, labels, backlinks, raw source scanning, and index result types.
- `indexing/search`: search query parsing, special filters, set operations, and block matching.

Keep host-facing imports stable through `indexing/nano-document-index.ts`. Internal indexing files should avoid repeating `nano-document-index` or `nano-document-search`.

## Package Candidate Map

- `autocomplete`: headless option selection plus optional DOM surface. Internal files use `core.ts`, `selection.ts`, `surface.ts`, `surface-elements.ts`, and `types.ts`.
- `inline-edit`: local contenteditable text primitives. `dom.ts` owns selection offsets, single-line normalization, range replacement, focus restore, and history intent.
- `inline-autocomplete`: extension behavior that maps inline triggers to autocomplete replacement ranges. `extension.ts` composes `inline-edit` primitives instead of duplicating DOM range editing.

Package-candidate folders should use short local filenames from the start; the package name already carries the long context.

## Markdown Codec Map

- `codecs/markdown/link`: link destination, escaping, parsing, serialization, and note-link token detection.

Keep Markdown codec moves cluster-based. Parent codec files may import through explicit cluster facades such as `./link/index`; files inside a cluster should use short local names such as `parse.ts`, `destination.ts`, and `serialize.ts`.

## Deferred Codec Candidates

`codecs/markdown` is still prefix-heavy, but it should not be moved as one broad cleanup. The safe future shape is likely:

- `codecs/markdown/inline`: inline token parse, merge, output, and serialize.
- `codecs/markdown/table`: table cells, pipes, normalization, parse, serialize, and types.
- `codecs/markdown/list`: list attrs, line parsing, order, parse, and serialize.
- `codecs/markdown/text-block`: paragraph, heading, quote, footnote, and list text-block parsing.

Move these only one cluster at a time, because parser and serializer files intentionally cross-call each other.

## Public API Rule

Public exports may keep stable Nano names even when internals move. Internal files should prefer local names:

- `runtime/create.ts` can still export `createNanoView`.
- `shell/shell.ts` can still export `NanoShell`; the type name may keep product context even when the file uses local folder context.
- Internal implementation files should avoid repeating `nano-view` or the folder name.

## Refactor Safety

Move one cohesive folder at a time.

After each move:

1. Update internal relative imports.
2. Update regression scripts that read files by path.
3. Search for stale paths with `rg`.
4. Run `CI=true pnpm exec tsc --noEmit`.

Use tests after a batch of moves, especially when keyboard, ProseMirror dispatch, source conversion, or ARIA/focus ownership changed.
