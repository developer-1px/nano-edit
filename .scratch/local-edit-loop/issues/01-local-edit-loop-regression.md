# Issue: Add a browser-level Local Edit Loop regression

Status: needs-triage
Parent PRD: ../PRD.md

## Outcome

Nano Edit has an executable product contract for the core loop: read the generated Markdown document, locally edit only the needed parts, persist the result as a Nano Document, and return to a quiet document-like surface.

## Scope

- Add a browser regression for the demo Local Edit Loop.
- Exercise the existing Self-Describing Demo Document.
- Verify initial Quiet Surface state.
- Edit text through browser input.
- Toggle a todo item through browser input.
- Edit a table cell through browser input.
- Verify undo/redo for a representative edit.
- Verify localStorage persistence and reload restoration.

## Out of Scope

- New visible demo controls.
- Markdown source editor work.
- Catalog/Kit/LLM selection concepts.
- Patch granularity work.

## Acceptance Criteria

- Running the new regression proves the Local Edit Loop against the actual demo app.
- `pnpm test`, `pnpm build`, `pnpm test:layout`, and the new regression pass.
- No decorative or instructional demo chrome is added.
