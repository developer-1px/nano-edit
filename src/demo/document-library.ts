import type { NanoDeck, NanoDocument } from '../core/nano-core'
import { nanoDocumentFromMarkdown } from '../codecs/markdown/nano-markdown'
import { initialNanoDeck } from './initial-deck'
import { initialNanoDocument } from './initial-document'
import { partCatalogDocument } from './part-catalog-document'
import { DEMO_DOCUMENT_STORAGE_KEY } from './persisted-document'
import { DEMO_DECK_STORAGE_KEY } from './persisted-deck'

export interface DemoDocumentDefinition {
  document: NanoDocument
  kind: 'document'
  id: string
  storageKey: string
  summary: string
  title: string
}

export interface DemoDeckDefinition {
  deck: NanoDeck
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

export type DemoArtifactDefinition =
  | DemoDeckDefinition
  | DemoDocumentDefinition
  | DemoInlineEditDefinition
  | DemoMentionComposerDefinition

export const defaultDemoDocumentId = 'overview'

const catalogContractDocument = nanoDocumentFromMarkdown(`# Catalog Contract

Nano Edit의 catalog는 LLM에게 "무엇을 조립할 수 있는지" 전달하는 제한된 계약이다. 목표는 자유 생성된 플러그인 이름을 믿는 것이 아니라, host가 제공한 part 목록 안에서 필요한 기능만 고르게 하는 것이다.

## Descriptor Shape

Catalog item은 사람이 읽는 설명과 runtime이 검증하는 계약을 함께 가져야 한다.

\`\`\`ts
interface NanoPartDescriptor {
  id: string
  kind: 'block' | 'inline' | 'codec' | 'feature' | 'command'
  status: 'current' | 'planned'
  requires?: readonly string[]
  provides: readonly string[]
}
\`\`\`

| Field | 의미 | 사람이 확인할 것 |
| --- | --- | --- |
| id | 선택 가능한 part의 안정적 이름 | 같은 이름이 다른 책임을 갖지 않는가 |
| kind | block, inline, codec, feature 같은 분류 | UI affordance와 schema 계약이 섞이지 않는가 |
| requires | 함께 필요한 part | 선택 결과가 실행 가능한가 |
| provides | host가 기대할 수 있는 capability | LLM 설명과 runtime 동작이 맞는가 |

## Current Catalog

| Part id | Kind | Status | Provides |
| --- | --- | --- | --- |
| block.paragraph | block | current | Markdown fallback block |
| block.heading | block | current | document outline |
| block.todo | block | current | generated checklist edit |
| block.table | block | current | report table correction |
| inline.link | inline | current | external reference |
| inline.note-link | inline | current | wiki style note reference |
| feature.source-reveal | feature | current | local Markdown source choice |
| feature.table-cell-edit | feature | current | plain cell local edit |

## Selection Rule

1. 문서 목적을 먼저 본다
2. 필요한 block과 inline mark를 고른다
3. 그 선택을 지원하는 codec과 feature를 붙인다
4. host policy가 허용하지 않는 part는 제외한다
5. 사람이 검토할 수 있는 diff로 kit 후보를 남긴다

## Validation Checklist

- [x] 선택지는 제한된 catalog에서만 온다
- [x] part 설명은 사람이 읽을 수 있다
- [x] runtime은 id와 dependency를 검증한다
- [ ] schema pack과 codec pack을 descriptor에 포함한다
- [ ] agent 선택 결과를 product policy와 함께 기록한다`)

const localEditSurfaceDocument = nanoDocumentFromMarkdown(`# Local Edit Surface

Nano Edit의 surface는 문서를 먼저 보여주고, 사용자가 들어간 지점만 편집 가능한 것처럼 반응한다. 별도 편집 모드 버튼보다, 문서가 열리는 순간 이미 수정 가능한 상태라는 감각이 중요하다.

## Selection Surfaces

| Surface | Selection | Commit path |
| --- | --- | --- |
| Paragraph | ProseMirror TextSelection | Nano Document text patch |
| Whole block | ProseMirror NodeSelection | block move, duplicate, delete |
| Table cell | Native DOM Selection | table rows attr patch |
| Source panel | textarea selection | block Markdown replacement |

표 셀은 nested table document가 아니라 \`nano-table\` block의 \`rows\` 값을 고친다. 그래서 셀 안에서는 browser native selection을 쓰고, plugin이 입력을 다시 table node attr로 commit한다.

## Quiet Edit Examples

| Generated output | Typical human edit | Surface |
| --- | --- | --- |
| API comparison table | 셀 하나만 고침 | table cell |
| PRD checklist | 완료 여부만 바꿈 | todo checkbox |
| Release note paragraph | 문장 일부만 다듬음 | text selection |
| Link-heavy reference | label만 확인 | source reveal |

## Product Constraint

- [x] 문서 본문이 chrome보다 먼저 보인다
- [x] Markdown syntax는 cursor 주변에서만 드러난다
- [x] table cell은 plain cell일 때만 직접 수정된다
- [x] inspector는 사용자가 부를 때만 열린다
- [ ] selection surface 차이를 더 작게 보이게 한다

## Implementation Note

\`\`\`ts
createNanoView({
  mount,
  engine,
  kit,
})
\`\`\`

Host product가 여러 문서를 다루더라도 Nano View는 선택된 한 문서의 surface만 맡는다. 문서 목록, 권한, 저장 위치, 라우팅은 host가 소유하고 editor engine은 local edit loop에 집중한다.`)

export const demoDocuments: readonly DemoDocumentDefinition[] = [
  {
    kind: 'document',
    id: defaultDemoDocumentId,
    title: 'Nano Edit',
    summary: 'engine overview',
    storageKey: DEMO_DOCUMENT_STORAGE_KEY,
    document: initialNanoDocument,
  },
  {
    kind: 'document',
    id: 'catalog-contract',
    title: 'Catalog Contract',
    summary: 'part selection model',
    storageKey: `${DEMO_DOCUMENT_STORAGE_KEY}:catalog-contract`,
    document: catalogContractDocument,
  },
  {
    kind: 'document',
    id: 'part-catalog',
    title: 'Content Catalog',
    summary: 'rendered content parts',
    storageKey: `${DEMO_DOCUMENT_STORAGE_KEY}:part-catalog`,
    document: partCatalogDocument,
  },
  {
    kind: 'document',
    id: 'local-edit-surface',
    title: 'Local Edit Surface',
    summary: 'quiet edit behavior',
    storageKey: `${DEMO_DOCUMENT_STORAGE_KEY}:local-edit-surface`,
    document: localEditSurfaceDocument,
  },
]

export const demoArtifacts: readonly DemoArtifactDefinition[] = [
  ...demoDocuments,
  {
    kind: 'inline-edit',
    id: 'inline-edit',
    title: 'Inline Edit',
    summary: 'mention and slash surface',
  },
  {
    kind: 'mention-composer',
    id: 'mention-composer',
    title: 'Mention Composer',
    summary: 'mention, slash, wiki-link triggers',
  },
  {
    kind: 'deck',
    id: 'generated-deck-review',
    title: 'Generated Deck Review',
    summary: 'presentation surface',
    storageKey: DEMO_DECK_STORAGE_KEY,
    deck: initialNanoDeck,
  },
]

export function demoDocumentById(id: string): DemoDocumentDefinition {
  return demoDocuments.find((document) => document.id === id)
    ?? demoDocuments.find((document) => document.id === defaultDemoDocumentId)
    ?? demoDocuments[0]!
}

export function demoArtifactById(id: string): DemoArtifactDefinition {
  return demoArtifacts.find((artifact) => artifact.id === id)
    ?? demoArtifacts.find((artifact) => artifact.id === defaultDemoDocumentId)
    ?? demoArtifacts[0]!
}

export function validDemoDocumentId(id: string | null): string {
  return demoArtifacts.some((artifact) => artifact.id === id)
    ? id!
    : defaultDemoDocumentId
}
