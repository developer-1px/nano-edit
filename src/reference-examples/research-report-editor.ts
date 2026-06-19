import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type ResearchReportEditorReferenceHandle = ReferenceViewHandle

export function createResearchReportEditorReference(mount: HTMLElement): ResearchReportEditorReferenceHandle {
  return createReferenceView(mount, `# Research Report

## Findings

Generated reports need selective correction more often than full rewrite.

| Finding | Evidence | Edit surface |
| --- | --- | --- |
| Tables drift | analyst review | cell edit |
| Links rot | source check | source reveal |
| Claims need tags | taxonomy | inline marks |

- [ ] Add citation custom block after descriptor contract lands`)
}
