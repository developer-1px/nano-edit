# Nano Edit

Nano Edit's working identity is Nano Editable: a contenteditable-based editing foundation for quiet, Markdown-native local editing features.

For package consumers, start with `docs/package-consumer-contract.md`.
For scope decisions, use `docs/contenteditable-foundation-gate.md`.

Recommended feature entries:

- `nano-edit/inline-edit`
- `nano-edit/autocomplete`
- `nano-edit/inline-autocomplete`
- `nano-edit/markdown`
- `nano-edit/document-index`
- `nano-edit/model`

The root `nano-edit` entry is the full editor assembly surface. Use it when mounting the Nano view. Prefer subpath entries when a host only needs a small editing feature.

Nano core does not own native `input`, `textarea`, or `select` edit lifecycles. Rebuild that interaction as a contenteditable surface before treating it as Nano package pressure.
