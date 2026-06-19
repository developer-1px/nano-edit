import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type CustomBlockAuditReportReferenceHandle = ReferenceViewHandle

export function createCustomBlockAuditReportReference(mount: HTMLElement): CustomBlockAuditReportReferenceHandle {
  return createReferenceView(mount, `# Custom Block Audit

| Descriptor | Status | Note |
| --- | --- | --- |
| block.table | current | Built-in schema |
| block.todo | current | Capability-owned |
| custom.audit-card | planned | Host descriptor |

- [x] Custom block data must remain JSON serializable
- [ ] Descriptor should include schema, renderer, commands`)
}
