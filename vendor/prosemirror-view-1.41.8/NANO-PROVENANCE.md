# ProseMirror View Baseline

This directory is an unmodified source baseline copied from `prosemirror-view`.

- Package: `prosemirror-view`
- Version: `1.41.8`
- License: MIT
- Copied from: `node_modules/.pnpm/prosemirror-view@1.41.8/node_modules/prosemirror-view`
- Copied files:
  - `src/`
  - `LICENSE`
  - `package.json`
  - `README.md` as `README.upstream.md`

Purpose:

Nano Edit is not a ProseMirror wrapper. This baseline exists so Nano's native DOM
runtime can start from ProseMirror's browser editing work instead of being
invented from zero.

Porting rule:

- Keep this directory as the upstream reference copy.
- Put Nano-specific runtime code under `src/`, not in this baseline directory.
- Preserve the MIT license notice in copied or derived runtime files.
- Replace ProseMirror document/state/transaction concepts with Nano
  `json-document` state, Zod schema validation, JSON Patch commits, and
  Nano selection snapshots.

Target extraction area:

- `src/domobserver.ts`
- `src/input.ts`
- `src/selection.ts`
- `src/dom.ts`
- `src/domchange.ts`
- `src/domcoords.ts`
- `src/clipboard.ts`
- `src/capturekeys.ts`
- `src/browser.ts`
