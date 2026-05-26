import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../core/nano-core'
import { nanoDocumentFromMarkdown } from '../codecs/markdown/nano-markdown'

const initialMarkdown = `# Nano Edit

Nano Edit은 AI가 만든 Markdown 문서를 앱 안에서 **문서처럼 읽게 하고**, 필요한 부분만 조용히 고칠 수 있게 하는 embeddable editor package다. 방향은 더 많은 편집 chrome이 아니라, 같은 quiet local edit loop 안에서 읽고, 일부만 고치고, 저장하는 것이다.

> 이 데모는 별도 제품 페이지가 아니라 Nano Edit이 다루는 문서의 한 예시다. 문장 하나를 바꾸거나 체크 항목, 표의 일반 셀을 고쳐 보면 편집 affordance가 필요한 곳에서만 나타난다.

## 어디에 맞는가

- AI 응답 리포트의 일부 확인과 수정
- 회의록과 PRD 초안의 작은 보정
- 표, 링크, 체크리스트가 섞인 답변 문서 정리
- 생성 결과를 앱 안에서 바로 읽고 저장

## 기본 감각

기본 상태는 viewer에 가깝다. Markdown은 문서의 유일한 원본이 아니라 여러 표현 중 하나이고, Nano Document가 block, inline mark, source choice를 구조화해서 들고 있다. 그래서 \`**bold**\`, *italic*, ==highlight==, ~~discarded phrase~~ 같은 표현도 읽는 흐름을 깨지 않는다. 다음 기준도 같다. 더 많은 Markdown 표현을 같은 quiet surface에서 읽고, 필요한 일부만 바꾸게 만든다.

- [x] 본문은 먼저 읽힌다
- [ ] 필요한 문장만 조용히 고친다
- [ ] 표의 일반 셀을 저장까지 확인한다

## 구성

| 영역 | 역할 | 편집 중 보이는 것 |
| --- | --- | --- |
| Nano Document | 구조화된 문서 상태 | block과 mark |
| Markdown codec | import/export | 필요한 source choice |
| ProseMirror view | inline editing surface | cursor 주변 affordance |
| zod-crud | patch, history, selection | 저장 가능한 변경 기록 |
| Local edit loop | review, edit, save | undo와 persistence |

## 붙이는 모양

\`\`\`ts
import { createNanoDocument, createNanoView } from 'nano-edit'
import 'nano-edit/style.css'

const engine = createNanoDocument(markdownDocument)
createNanoView({ mount, engine })
\`\`\`

## 한번 고쳐보기

이 문서는 [[Nano Edit Demo]]라는 note link와 #generated-markdown 태그를 포함한다. 아래 이미지는 문서 안에 섞인 visual block이 주변 chrome 없이 놓이는지 확인하기 위한 작은 기준점이다.[^demo]

![Nano Edit icon](/favicon.svg)

1. 첫 문단에 평가 결과를 한 줄 추가한다
2. 체크리스트 한 줄을 완료 처리한다
3. 표의 일반 셀 하나를 현재 제품 언어에 맞게 다듬는다

관련 배경은 [Live Markdown spec](https://spec.commonmark.org/0.31.2/)처럼 외부 문서를 참조할 수 있지만, 이 editor의 중심은 source mode가 아니라 local edit이다.

[^demo]: 데모 문서는 사용법을 설명할 수 있지만, 설명은 문서 본문 안에 머물러야 한다. 다음 방향도 이 원칙을 벗어나지 않는다.`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
