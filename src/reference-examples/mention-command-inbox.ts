import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type MentionCommandInboxReferenceHandle = ReferenceViewHandle

export function createMentionCommandInboxReference(mount: HTMLElement): MentionCommandInboxReferenceHandle {
  return createReferenceView(mount, `# Command Inbox

Review [[Nano Document]], [[ProseMirror Provider]], and #json-document before changing the package surface.

| Trigger | Expected result |
| --- | --- |
| @owner | mention candidate |
| /todo | block command |
| [[note]] | note link |

- [ ] Keep command UI quiet until invoked`)
}
