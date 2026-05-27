import type { NanoDeck, NanoDeckEngine } from '../core/nano-core'
import { createNanoDeck } from '../core/nano-core'
import { nanoDeckFromMarkdown } from '../codecs/markdown/nano-markdown'

const initialDeckMarkdown = `---
title: Generated Deck Review
theme: quiet
---

# Generated Artifacts Need Edits

- LLM output is moving from long documents to presentation-style artifacts
- Generated slides still need last-mile human edits
- Nano Edit should keep the surface readable while local edits stay cheap

::: notes
The point is not to clone PowerPoint. The point is to make generated slides usable before export.
:::

---

# Nano Deck Model

| Layer | Role |
| --- | --- |
| Deck | presentation artifact root |
| Slide | page-level reading unit |
| Region | title, body, notes slot |
| Nano Block | reusable editable content |

---

# First Editable Slice

- [x] Parse LLM-friendly slide Markdown
- [x] Reuse Nano blocks inside slides
- [x] Edit current slide through the existing quiet surface
- [ ] Add theme-driven slide layouts
- [ ] Add export adapters`

export const initialNanoDeck: NanoDeck = nanoDeckFromMarkdown(initialDeckMarkdown)

export function createDemoNanoDeck(): NanoDeckEngine {
  return createNanoDeck(initialNanoDeck)
}
