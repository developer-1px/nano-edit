import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type ReviewWorkspaceReferenceHandle = ReferenceViewHandle

export function createReviewWorkspaceReference(mount: HTMLElement): ReviewWorkspaceReferenceHandle {
  return createReferenceView(mount, `# Review Workspace

| Pane | Responsibility |
| --- | --- |
| Artifact list | demo host |
| Editable document | nano-edit package |
| Persistence | host-owned |

## Boundary

Nano Edit should expose an embeddable engine and view. The local app should prove reference workflows without becoming the product.`)
}
