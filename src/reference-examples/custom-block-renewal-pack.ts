import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type CustomBlockRenewalPackReferenceHandle = ReferenceViewHandle

export function createCustomBlockRenewalPackReference(mount: HTMLElement): CustomBlockRenewalPackReferenceHandle {
  return createReferenceView(mount, `# Renewal Pack

| Account | Renewal | Risk |
| --- | ---: | --- |
| Atlas | 2026-07-15 | Medium |
| Northstar | 2026-08-01 | Low |
| Signal | 2026-08-20 | High |

- [ ] Convert renewal card to host-owned custom block descriptor`)
}
