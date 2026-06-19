import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type IssueTriageDeskReferenceHandle = ReferenceViewHandle

export function createIssueTriageDeskReference(mount: HTMLElement): IssueTriageDeskReferenceHandle {
  return createReferenceView(mount, `# Issue Triage

| Issue | State | Owner |
| --- | --- | --- |
| Engine patch path | active | core |
| Custom block descriptor | review | editor |
| Demo artifact host | active | demo |

## Queue

- [x] Restore missing source modules
- [ ] Add package-consumer smoke around createNanoDocument
- [ ] Split demo host from package surface`)
}
