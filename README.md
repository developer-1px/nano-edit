# Nano Edit

Nano Edit is a `json-document` headless contenteditable document engine for
quiet, Markdown-native local editing features.

For Nano2 architecture, start with `docs/nano2-headless-design-policy.md` and
`docs/nano2-headless-capability-matrix.md`.

Legacy Nano1 package-consumer documents are discarded as architecture
authority. They remain only as tombstones that point back to the Nano2 policy.

Feature entries:

- `nano-edit/inline-edit`
- `nano-edit/autocomplete`
- `nano-edit/inline-autocomplete`
- `nano-edit/inline-tokens`
- `nano-edit/markdown`
- `nano-edit/document-index`
- `nano-edit/model` (experimental validation, inferred types, empty values)
- `nano-edit/suggestion` (compatibility alias for autocomplete naming)

The root `nano-edit` entry is the current dogfood assembly surface. Do not use
the old package seam map as the design authority for Nano2.

Nano2 first proves the official ProseMirror example capability set with
`json-document` as canonical headless state. Nano1 examples and Bear-like
product polish come after that capability proof.
