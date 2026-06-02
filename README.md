# Nano Edit

Nano Edit is an embeddable editor package for quiet, Markdown-native document editing.

For package consumers, start with `docs/package-consumer-contract.md`.

Recommended feature entries:

- `nano-edit/inline-edit`
- `nano-edit/autocomplete`
- `nano-edit/inline-autocomplete`
- `nano-edit/markdown`
- `nano-edit/document-index`
- `nano-edit/model`

The root `nano-edit` entry is the full editor assembly surface. Use it when mounting the Nano view. Prefer subpath entries when a host only needs a small editing feature.
