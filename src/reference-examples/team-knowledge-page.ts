import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type TeamKnowledgePageReferenceHandle = ReferenceViewHandle

export function createTeamKnowledgePageReference(mount: HTMLElement): TeamKnowledgePageReferenceHandle {
  return createReferenceView(mount, `# Team Knowledge

## Service Map

| Area | Owner | Current note |
| --- | --- | --- |
| Docs engine | Platform | Nano Document is canonical |
| Runtime provider | Editor | ProseMirror maps view state |
| Markdown IO | Content | Import/export expression |

## Open Checks

- [x] Keep editable content as the guidance surface
- [x] Commit edits through json-document
- [ ] Move provider assumptions behind descriptors`)
}
