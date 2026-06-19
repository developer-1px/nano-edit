import type { NanoDocument } from '../entities/document/nano-document-model'
import type { NanoDeck as NanoDeckModel } from '../entities/deck/nano-deck-model'
import { initialNanoDeck } from './initial-deck'
import { initialNanoDocument } from './initial-document'
import { partCatalogDocument } from './part-catalog-document'
import { DEMO_DECK_STORAGE_KEY } from './persisted-deck'
import { DEMO_DOCUMENT_STORAGE_KEY } from './persisted-document'

export interface DemoDocumentDefinition {
  document: NanoDocument
  kind: 'document'
  id: string
  storageKey: string
  summary: string
  title: string
}

export interface DemoDeckDefinition {
  deck: NanoDeckModel
  kind: 'deck'
  id: string
  storageKey: string
  summary: string
  title: string
}

export interface DemoInlineEditDefinition {
  kind: 'inline-edit'
  id: string
  summary: string
  title: string
}

export interface DemoMentionComposerDefinition {
  kind: 'mention-composer'
  id: string
  summary: string
  title: string
}

export type DemoReferenceKind =
  | 'team-knowledge-page-reference'
  | 'launch-forecast-grid-reference'
  | 'issue-triage-desk-reference'
  | 'mention-command-inbox-reference'
  | 'board-deck-review-reference'
  | 'custom-block-audit-report-reference'
  | 'custom-block-renewal-pack-reference'
  | 'review-collaboration-room-reference'
  | 'review-backend-session-reference'
  | 'research-report-editor-reference'
  | 'structured-table-review-reference'
  | 'review-workspace-reference'

export type DemoReferenceDefinition = {
  [Kind in DemoReferenceKind]: {
    kind: Kind
    id: string
    summary: string
    title: string
  }
}[DemoReferenceKind]

export type DemoArtifactDefinition =
  | DemoDeckDefinition
  | DemoDocumentDefinition
  | DemoInlineEditDefinition
  | DemoMentionComposerDefinition
  | DemoReferenceDefinition

export const defaultDemoArtifactId = 'overview'

export const demoDocuments: readonly DemoDocumentDefinition[] = [
  {
    kind: 'document',
    id: defaultDemoArtifactId,
    title: 'Nano Edit',
    summary: 'engine overview',
    storageKey: DEMO_DOCUMENT_STORAGE_KEY,
    document: initialNanoDocument,
  },
  {
    kind: 'document',
    id: 'part-catalog',
    title: 'Content Catalog',
    summary: 'rendered parts',
    storageKey: `${DEMO_DOCUMENT_STORAGE_KEY}:part-catalog`,
    document: partCatalogDocument,
  },
]

export const demoArtifacts: readonly DemoArtifactDefinition[] = [
  ...demoDocuments,
  {
    kind: 'deck',
    id: 'generated-deck-review',
    title: 'Generated Deck Review',
    summary: 'deck surface',
    storageKey: DEMO_DECK_STORAGE_KEY,
    deck: initialNanoDeck,
  },
  {
    kind: 'inline-edit',
    id: 'inline-edit',
    title: 'Inline Edit',
    summary: 'scalar edit',
  },
  {
    kind: 'mention-composer',
    id: 'mention-composer',
    title: 'Mention Composer',
    summary: 'trigger surface',
  },
  {
    kind: 'team-knowledge-page-reference',
    id: 'team-knowledge-page',
    title: 'Team Knowledge',
    summary: 'doc reference',
  },
  {
    kind: 'launch-forecast-grid-reference',
    id: 'launch-forecast-grid',
    title: 'Launch Forecast',
    summary: 'table reference',
  },
  {
    kind: 'issue-triage-desk-reference',
    id: 'issue-triage-desk',
    title: 'Issue Triage',
    summary: 'queue reference',
  },
  {
    kind: 'mention-command-inbox-reference',
    id: 'mention-command-inbox',
    title: 'Command Inbox',
    summary: 'mention reference',
  },
  {
    kind: 'board-deck-review-reference',
    id: 'board-deck-review',
    title: 'Board Deck Review',
    summary: 'deck reference',
  },
  {
    kind: 'custom-block-audit-report-reference',
    id: 'custom-block-audit-report',
    title: 'Audit Report',
    summary: 'custom block reference',
  },
  {
    kind: 'custom-block-renewal-pack-reference',
    id: 'custom-block-renewal-pack',
    title: 'Renewal Pack',
    summary: 'custom block reference',
  },
  {
    kind: 'review-collaboration-room-reference',
    id: 'review-collaboration-room',
    title: 'Collaboration Room',
    summary: 'review reference',
  },
  {
    kind: 'review-backend-session-reference',
    id: 'review-backend-session',
    title: 'Backend Session',
    summary: 'session reference',
  },
  {
    kind: 'research-report-editor-reference',
    id: 'research-report-editor',
    title: 'Research Report',
    summary: 'report reference',
  },
  {
    kind: 'structured-table-review-reference',
    id: 'structured-table-review',
    title: 'Structured Table',
    summary: 'table review',
  },
  {
    kind: 'review-workspace-reference',
    id: 'review-workspace',
    title: 'Review Workspace',
    summary: 'workspace reference',
  },
]

export function demoArtifactById(id: string): DemoArtifactDefinition {
  return demoArtifacts.find((artifact) => artifact.id === id)
    ?? demoArtifacts.find((artifact) => artifact.id === defaultDemoArtifactId)
    ?? demoArtifacts[0]!
}

export function validDemoArtifactId(id: string | null): string {
  return demoArtifacts.some((artifact) => artifact.id === id)
    ? id!
    : defaultDemoArtifactId
}
