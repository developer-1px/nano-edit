import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type BoardDeckReviewReferenceHandle = ReferenceViewHandle

export function createBoardDeckReviewReference(mount: HTMLElement): BoardDeckReviewReferenceHandle {
  return createReferenceView(mount, `# Board Deck Review

| Slide | Decision | Edit |
| --- | --- | --- |
| Direction | Keep | Name json-document as engine |
| Architecture | Revise | Provider boundary first |
| Demo | Keep | Reference app, not product |

- [x] Make document state canonical
- [ ] Show deck review as editable artifact`)
}
