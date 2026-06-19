import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type ReviewBackendSessionReferenceHandle = ReferenceViewHandle

export function createReviewBackendSessionReference(mount: HTMLElement): ReviewBackendSessionReferenceHandle {
  return createReferenceView(mount, `# Backend Review Session

| API | Payload | Engine path |
| --- | --- | --- |
| save patch | JSON Patch | json-document commit |
| load doc | Nano Document | schema parse |
| sync peer | change message | collaboration receive |

- [ ] Persist Nano Document changes, not ProseMirror transactions`)
}
