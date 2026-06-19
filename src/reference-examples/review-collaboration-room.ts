import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type ReviewCollaborationRoomReferenceHandle = ReferenceViewHandle

export function createReviewCollaborationRoomReference(mount: HTMLElement): ReviewCollaborationRoomReferenceHandle {
  return createReferenceView(mount, `# Review Room

| Reviewer | Focus | State |
| --- | --- | --- |
| Core | json-document commits | active |
| Editor | ProseMirror provider | active |
| Product | demo restraint | waiting |

- [x] Local edits emit Nano Document changes
- [ ] Remote changes should preserve selection policy`)
}
