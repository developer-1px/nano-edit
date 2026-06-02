# Package Consumer Contract

Nano Edit should be consumed as small feature seams first. The full editor surface is available, but it is not the default path for chat editors, Markdown inline token edits, component labels, data-only Markdown transforms, or document search.

## Contract Status

This repo is currently a dogfood package contract, not an npm publish contract.

- `private: true` intentionally prevents accidental publish.
- `version: 0.1.0-dogfood.0` marks the current local package contract baseline.
- Public exports still point at source `.ts` files. This is temporary and explicit: consumers must use a TypeScript-aware bundler or workspace setup.
- Each public export includes a `types` condition in `package.json`.
- `pnpm check:public-types` verifies that the documented public subpaths resolve through the package export map.

Promotion to a publish contract should replace source `.ts` export targets with generated build and declaration artifacts.

## Entry Guide

| Entry | Status | Use when | Avoid when |
| --- | --- | --- | --- |
| `nano-edit/inline-edit` | recommended | A host needs single-line contenteditable helpers, selection offsets, paste normalization, history intent, insertion, or focus restore. | The host needs a whole document editor. |
| `nano-edit/autocomplete` | recommended | A host needs headless option selection or the optional DOM autocomplete surface. | The host wants Nano document commands specifically. |
| `nano-edit/inline-autocomplete` | recommended | A host needs trigger/query/replacement-range behavior for mentions, slash commands, tags, or variables on top of inline edit. | The host only needs a static listbox. |
| `nano-edit/markdown` | recommended | A host needs data-only Markdown parse, serialize, round-trip, or per-block Markdown extraction. | The host needs to mount an editor view. |
| `nano-edit/document-index` | recommended | A host needs indexes or search over an already parsed Nano document. | The host needs document persistence or multi-document routing. |
| `nano-edit/model` | recommended | A host needs pure schemas, inferred types, or empty document/deck values. | The host needs zod-crud engines or editor runtime selection helpers. |
| `nano-edit/inline-tokens` | supported | A host needs exported inline token helpers. | The host only needs plain inline edit primitives. |
| `nano-edit/suggestion` | compatibility | Existing code still uses suggestion naming. | New code can use `nano-edit/autocomplete`. |
| `nano-edit` | full assembly | A host is mounting the Nano view or needs the root editor package facade. | A host only needs one small editing feature. |
| `nano-edit/style.css` | full assembly style | A host mounts the Nano view. | A host only uses headless or data-only entries. |

Root `nano-edit` means full editor assembly. It exposes model, Markdown, document index, ProseMirror conversion, view creation, editor kit, capabilities, and feature primitives together. Small feature consumers should prefer subpath imports so they do not accidentally couple to the full editor/view surface.

## Responsibility Boundaries

| Seam | Package owns | Host owns |
| --- | --- | --- |
| `inline-edit` | Single-line normalization, line-break detection, undo/redo intent detection, selection offset calculation, text insertion/replacement, focus restore. | Commit/cancel lifecycle, local history snapshots, persistence, product validation, rendered label state. |
| `autocomplete` | Option filtering helpers, disabled-option skipping, selected-index movement, headless state, optional DOM surface with combobox/listbox semantics. | Option data, product-specific command effects, custom anchored rendering when using the headless core, host-level interaction ownership. |
| `inline-autocomplete` | Trigger context, query extraction, replacement range detection, inserted text formatting, trigger/query replacement. | Trigger configuration, option sources, commit behavior, product-specific mention/slash/tag semantics. |
| `markdown` | Nano document parse, Markdown serialization, deck Markdown conversion, per-block Markdown extraction. | Storage, diff presentation, merge policy, stable identity expectations across separately parsed documents. |
| `document-index` | Index construction, index text extraction, keyword search, tag filters, special search filters such as `@title` and `@tagged`. | Multi-document collection management, ranking, search UI, navigation, permissions. |
| `model` | Pure schemas, inferred types, empty Nano document/deck values. | Runtime persistence, validation timing, migration policy, host document identity. |

## Public Contract Gates

Use these commands before treating the package contract as dogfood-ready:

```sh
pnpm check:public-types
pnpm benchmark:consumer-blind:snapshot
CI=true pnpm exec tsc --noEmit
CI=true pnpm test
CI=true pnpm build
```

`pnpm check:public-types` compiles a consumer-style fixture that imports only through package exports. It is the focused gate for subpath type resolution.

`pnpm benchmark:consumer-blind:snapshot` prints the export map and public signatures used by Consumer Blind Benchmark tasks. Update the benchmark only when the public contract changes.

## Change Rule

Do not add core API because one consumer finds assembly awkward. Promote a new core capability only when a real host or Consumer Blind run repeats the same `API awkward` or `API missing` blocker across at least two distinct tasks.
