import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type StructuredTableReviewReferenceHandle = ReferenceViewHandle

export function createStructuredTableReviewReference(mount: HTMLElement): StructuredTableReviewReferenceHandle {
  return createReferenceView(mount, `# Structured Table Review

| Field | Required | Current |
| --- | --- | --- |
| title | yes | present |
| owner | yes | missing |
| status | yes | draft |
| source | no | link |

- [ ] Edit the missing owner cell directly
- [ ] Export back to Markdown after correction`)
}
