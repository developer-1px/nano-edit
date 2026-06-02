# Changelog

## 0.1.0-dogfood.0 - 2026-06-03

### Added

- Added `createContenteditableScalarEdit` to `nano-edit/inline-edit` as a host-neutral contenteditable scalar edit lifecycle.
- Added lifecycle coverage for initial text, caret placement, single-line normalization, paste normalization, Enter commit, Escape cancel, undo/redo intent callbacks, composition-aware input, host focus restore, and listener cleanup.
- Added `pnpm test:inline-scalar-edit` to verify the scalar edit lifecycle in a browser.

### Changed

- Updated the public type contract so contenteditable cell editing can consume the scalar edit lifecycle without manually wiring raw DOM events.
- Updated consumer and foundation docs to treat spreadsheet editing as one host pressure for Nano Editable, not as the module identity.
- Kept existing low-level inline edit helpers public for backward compatibility.

### Fixed

- Restored the demo document self-description expected by the regression suite.
