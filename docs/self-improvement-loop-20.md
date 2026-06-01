# Self-Improvement Loop 20

Date: 2026-05-30

Scope: Nano Edit inline package seams, especially `inline-edit`, `autocomplete`, and `inline-autocomplete`.

Loop unit: probe -> finding -> action -> evidence.

| # | Probe | Finding | Action | Evidence |
|---:|---|---|---|---|
| 1 | Inspect current worktree before changing files | Repo is intentionally dirty with many active edits; unrelated changes must not be reverted | Continued with scoped edits only | `git status --short` |
| 2 | Inventory inline package exports | `inline-edit`, `autocomplete`, `inline-autocomplete`, and `suggestion` are exposed | Kept package boundary | `package.json`, `src/index.ts` |
| 3 | Re-read blind loop 2 results | `AutocompleteSurface` state inspection was still called awkward | Chose a narrow surface read API improvement | `docs/consumer-blind-dogfooding.md` |
| 4 | Compare `createAutocomplete` and `createAutocompleteSurface` APIs | Core autocomplete had `state()` and `selectedOption()`, surface did not | Added `state()` and `selectedOption()` to `AutocompleteSurface` | `src/autocomplete/types.ts`, `src/autocomplete/surface.ts` |
| 5 | Preserve type compatibility for `AutocompleteSurface` | Existing `AutocompleteSurface<TContext>` shape should keep working | Added optional second generic `TOption` with default | `src/autocomplete/types.ts` |
| 6 | Regression for surface query state | Surface query should be observable after `open(context, query)` | Added assertions for `surface.state().query` | `scripts/regressions/chunk-34.mjs` |
| 7 | Regression for surface selected option | Surface selected option should be observable after filtering | Added assertions for `surface.selectedOption()` | `scripts/regressions/chunk-34.mjs` |
| 8 | Probe old `surface.input.value` workaround | Source should not require direct input mutation after API change | Kept `open(context, query?)` and `setQuery(query)` path | `rg "surface.input.value" src scripts` |
| 9 | Probe `inlineAutocompleteMatchFromText` nearest trigger behavior | Multiple triggers before cursor should choose the nearest one | Added `Ask @mina /sum` regression | `scripts/regressions/chunk-40.mjs` |
| 10 | Probe cursor offset robustness | Offset beyond text length should clamp to text end | Added offset `99` regression | `scripts/regressions/chunk-40.mjs` |
| 11 | Probe paired trigger case | `{{user` should produce query `user` and replacement range | Kept paired-trigger regression | `scripts/regressions/chunk-40.mjs` |
| 12 | Probe compatibility helper ambiguity | `inlineAutocompleteContextFromInput` can be confused with full-text matching | Added public JSDoc pointing to `inlineAutocompleteMatchFromText` | `src/inline-autocomplete/extension.ts` |
| 13 | Probe consumer example completeness | Example did not mention surface state inspection | Added `state()` and `selectedOption()` note | `docs/inline-api-consumer-example.md` |
| 14 | Probe browser inline timing | Slash button path needed to wait for suggestion input focus | Added focus wait to inline browser regression | `scripts/regressions/browser-inline-edit-demo.mjs` |
| 15 | Typecheck after API additions | Type graph accepts new surface generic and methods | No further type fix needed | `pnpm exec tsc --noEmit` |
| 16 | Full regression after API additions | Existing regression suite passes with new match/surface tests | No further code fix needed | `CI=true pnpm test` |
| 17 | Production build after API additions | Vite/tsc production build passes | No build fix needed | `CI=true pnpm build` |
| 18 | Browser inline demo verification | Mention/slash/paste/undo browser path passes | No further demo fix needed | `pnpm test:inline-edit-demo` |
| 19 | Browser command surface verification | Command palette keyboard/ARIA path still passes | No further command fix needed | `pnpm test:command-surface` |
| 20 | Formatting and completion audit | Patch has no whitespace errors; loop produced one small API improvement plus docs/tests | Kept core seam stable after checks | `git diff --check` |

## Result

The 20-loop pass produced one small core API improvement:

- `AutocompleteSurface.state()`
- `AutocompleteSurface.selectedOption()`

It also produced supporting hardening:

- extra `inlineAutocompleteMatchFromText` regressions
- JSDoc for the compatibility trigger helper
- consumer example update
- browser regression timing fix

No further core API change was indicated by the final verification set.

