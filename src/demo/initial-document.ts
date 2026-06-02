import type { NanoDocument } from '../core/nano-core'
import { nanoDocumentFromMarkdown } from '../codecs/markdown/nano-markdown'

const initialMarkdown = `# Nano Edit

Nano Edit은 LLM이 생성한 Markdown을 제품 안에서 **공식 기술문서처럼 읽게 하고**, 필요한 일부만 조용히 수정하게 하는 embeddable editor package다. 이 문서 자체가 데모이며, 별도 docs-site chrome 없이 \`README.md\` 같은 문서가 바로 편집 surface가 되는 상태를 보여준다.

> [!NOTE]
> 이 화면은 landing page가 아니다. LLM이 만든 긴 기술문서를 그대로 열었을 때, 사용자는 문서를 먼저 읽고 필요한 문장, 표 셀, 체크 항목만 local edit로 고친다.

## Overview

Nano Edit의 핵심 가정은 간단하다. 앞으로 많은 제품은 AI가 만든 긴 Markdown 결과물을 보여주고, 사람은 그중 작은 부분만 검토하거나 바꾼다. 그래서 editor는 항상 보이는 command chrome보다, 문서의 흐름을 깨지 않는 **quiet local edit loop**를 우선한다.

Markdown은 유일한 원본이 아니라 여러 표현 중 하나다. 내부에서는 Nano Document가 block, inline mark, source choice를 구조화하고, Markdown codec은 import/export 계약을 맡는다. 그래서 \`**bold**\`, *italic*, ==highlight==, ~~outdated phrase~~, \`inline code\`, [[Nano Kit]] note link, #generated-markdown 태그가 문서 흐름 안에서 조용히 보존된다.

## Install

\`\`\`bash
pnpm add nano-edit
\`\`\`

Nano Edit은 host product가 이미 가지고 있는 저장소, 인증, 권한, 배포 구조를 소유하지 않는다. package는 editor engine, view, codec, index, command surface를 제공하고, host는 mount 위치와 persistence를 결정한다.

## Quickstart

\`\`\`ts
import {
  createNanoDocument,
  createNanoView,
  nanoDocumentFromMarkdown,
} from 'nano-edit'
import 'nano-edit/style.css'

const document = nanoDocumentFromMarkdown(markdown)
const engine = createNanoDocument(document)

createNanoView({
  mount,
  engine,
})
\`\`\`

기본 preset, 즉 default preset은 지금 데모와 같은 surface를 만든다. 문서는 먼저 읽히고, cursor가 들어간 곳 주변에서만 Markdown source affordance가 드러난다. table cell, todo checkbox, footnote reference, link title 같은 구조는 source text로 무너뜨리지 않고 문서처럼 다룬다.[^surface]

## Core Concepts

| Concept | 현재 역할 | 조립 엔진에서의 의미 |
| --- | --- | --- |
| Nano Document | 구조화된 문서 상태 | block과 mark의 최소 계약 |
| Markdown codec | Markdown import/export | LLM 결과물과 host 저장 포맷의 교차점 |
| Editor Kit | 선택된 part 묶음 | host나 agent가 조립하는 runtime preset |
| Capability | 기능 단위 affordance | command, shortcut, behavior의 후보 |
| View feature | surface plugin | source reveal, table cell edit 같은 편집 감각 |
| Catalog | 선택 가능한 part 설명 | LLM이 판단하는 제한된 option 목록 |

## Architecture

Nano Edit은 완성형 app보다 작은 engine package를 목표로 한다. host product는 이 package를 붙이고, 필요한 part만 선택한다.

\`\`\`text
nano-edit
├─ entities        # Nano Document, block, mark, reference contracts
├─ codecs          # Markdown import/export
├─ adapters        # ProseMirror schema, DOM, codec bridge
├─ capabilities    # selectable editing behavior slices
├─ features        # view-first local edit affordances
├─ engine          # kit composition entry
└─ view            # quiet editable surface
\`\`\`

현재 runtime은 ProseMirror를 view adapter로 사용하지만, public contract의 중심은 ProseMirror document가 아니라 Nano Document다. 이 기준이 있어야 Markdown도, future renderer도, LLM-selected kit도 같은 문서 상태를 공유할 수 있다.

## Kit API

현재 지원되는 kit seam은 block options와 view features를 조립한다. 아래 예시는 현재 코드에서 동작하는 범위다.

\`\`\`ts
import {
  basicCapability,
  createNanoDocument,
  createNanoEditorKit,
  createNanoView,
} from 'nano-edit'

const basicOnlyKit = createNanoEditorKit({
  id: 'docs.basic-only',
  capabilities: [basicCapability],
  viewFeatures: ['active-block-ui'],
})

createNanoView({
  mount,
  engine: createNanoDocument(document),
  kit: basicOnlyKit,
})
\`\`\`

비전은 더 넓다. catalog item은 단순한 string 목록이 아니라, schema, Markdown codec, ProseMirror adapter, command, view feature를 함께 설명하는 typed contract가 된다. LLM은 이 catalog를 보고 필요한 option만 선택하고, host는 선택 결과를 검증 가능한 kit으로 조립한다.

\`\`\`ts
const reportReviewKit = createNanoEditorKit({
  id: 'docs.report-review',
  parts: [
    'block.paragraph',
    'block.heading',
    'block.todo',
    'block.table',
    'inline.link',
    'inline.tag',
    'codec.markdown',
    'feature.source-reveal',
    'feature.table-cell-edit',
  ],
})
\`\`\`

위 예시는 planned contract다. 지금 데모는 그 방향을 설명하기 위해 문서 본문 안에서 catalog와 kit의 관계를 보여준다.

## Catalog Model

LLM이 선택해야 하는 catalog는 사람이 읽기에도 충분히 명확해야 한다. 사람이 검토할 수 없는 catalog는 agent에게도 안정적인 선택지가 되기 어렵다.

| Part id | Surface | Status | Pairs with | Why it exists |
| --- | --- | --- | --- | --- |
| block.paragraph | block option | current | codec.markdown | 모든 Markdown 문서의 fallback |
| block.heading | block option | current | feature.active-block-ui | 긴 기술문서의 section 구조 |
| block.todo | capability | current | feature.checkbox-edit | generated checklist의 작은 수정 |
| block.table | block option | current | feature.table-cell-edit | AI 리포트의 비교표 보정 |
| inline.link | mark option | current | feature.source-reveal | 외부 reference 보존 |
| inline.tag | mark option | current | index.search | #generated-markdown 같은 분류 |
| codec.markdown | codec | current | entities.document | LLM output import/export |
| feature.source-reveal | view feature | current | codec.markdown | cursor 주변 source choice 노출 |
| schema.block-pack | document schema | planned | adapter.prosemirror | part별 schema 조립 |
| adapter.prosemirror-pack | adapter | planned | schema.block-pack | selected schema를 view로 연결 |

## Generated Markdown Workflow

1. LLM이 PRD, 회의록, API note, release summary 같은 Markdown을 생성한다
2. Host product가 Markdown을 Nano Document로 import한다
3. Catalog 정책이 문서 목적에 맞는 kit을 고른다
4. 사용자는 공식 기술문서처럼 읽는다
5. 필요한 문장, 체크박스, 표 셀만 quiet local edit로 고친다
6. Host가 patch, history, persistence를 저장한다

이 흐름에서 중요한 점은 “편집 모드로 전환한다”가 아니라 “문서가 이미 편집 가능한 surface로 열려 있다”는 것이다. 읽기와 수정 사이에 큰 모드 전환이 없기 때문에 LLM 결과물을 검토하는 시간이 짧아진다.

## Example: Documentation Review Kit

아래 예시는 공식 기술문서 검토용 kit을 설명한다. 현재 runtime에서 완전히 동작하는 부분과 planned extension을 함께 보여준다.

\`\`\`ts
const documentationReviewKit = createNanoEditorKit({
  id: 'docs.review',
  capabilities: [
    basicCapability,
    todoCapability,
  ],
  viewFeatures: [
    'active-block-ui',
    'source-reveal',
    'table-cell-edit',
  ],
})
\`\`\`

이 kit은 문서가 길어도 chrome을 늘리지 않는다. heading은 section navigation의 기준이 되고, todo는 검토 checklist가 되고, table cell edit은 비교표의 작은 보정을 맡는다. source reveal은 cursor 주변에서만 Markdown 선택을 보여준다.

## Example: Agent-Selected Kit

미래형 catalog에서는 agent가 문서 목적을 보고 kit 후보를 만든다.

\`\`\`ts
const selected = selectEditorParts({
  documentKind: 'technical-docs',
  userIntent: 'review generated Markdown and patch only local details',
  allowedParts: editorPartCatalog,
})

const kit = createNanoEditorKit({
  id: selected.id,
  parts: selected.parts,
})
\`\`\`

선택은 자유 생성이 아니라 제한된 option 안에서 일어난다. 그래서 사람이 catalog를 읽고 평가할 수 있고, LLM도 같은 typed contract를 근거로 선택한다.

## Editing Surface Checklist

- [x] 문서 본문이 먼저 읽힌다
- [x] Markdown source는 필요한 순간에만 드러난다
- [x] 표의 일반 셀은 local edit로 고칠 수 있다
- [ ] schema와 codec도 kit에서 조립한다
- [ ] catalog item을 typed interface contract로 승격한다
- [ ] agent가 선택한 kit을 사람이 검토하는 diff를 제공한다

## Try It In This Document

이 문서는 [[Nano Edit Demo]] note link와 #generated-markdown 태그를 포함한다. 아래 이미지는 문서 안에 visual block이 섞여도 주변 chrome 없이 놓이는지 확인하기 위한 작은 기준점이다.

![Nano Edit icon](/favicon.svg)

1. Overview의 첫 문장을 현재 제품 언어에 맞게 다듬는다
2. Editing Surface Checklist의 planned 항목 하나를 완료 처리한다
3. Catalog Model 표에서 \`Status\` 셀 하나를 바꿔 본다
4. Kit API 예시의 \`id\` 값을 host product 이름으로 바꿔 본다

## FAQ

### Is this a Markdown editor?

Markdown을 중요하게 다루지만, plain textarea는 아니다. Nano Edit은 Markdown-Native Document를 Nano Document로 구조화하고, Markdown은 import/export와 source choice 보존을 위한 표현으로 다룬다.

### Why not show a full docs sidebar?

이 데모의 의도는 docs-site UI를 만드는 것이 아니다. LLM이 생성한 문서 자체가 이미 공식 기술문서처럼 충분히 구조화되어 있고, 그 문서가 바로 editable surface라는 점을 보여주는 것이다.

### What is current and what is planned?

현재는 block options와 view features를 kit으로 조립할 수 있다. planned direction은 schema, Markdown codec, ProseMirror adapter까지 part contract로 올리는 것이다. 이 문서는 그 비전을 숨기지 않되, current/planned 상태를 표로 나눠 적는다.

### How does this relate to CommonMark?

Nano Edit은 [CommonMark](https://spec.commonmark.org/0.31.2/) 같은 Markdown 규칙과 호환되는 표현을 다루지만, 목표는 byte-perfect source editor가 아니다. 편집에 영향을 주는 source choice는 보존하고, 문서로 읽는 흐름을 우선한다.

[^surface]: 데모 문서는 사용법과 구조를 설명할 수 있지만, 설명은 문서 본문 안에 머물러야 한다. Nano Edit의 chrome은 문서보다 앞에 서지 않는다.`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)
