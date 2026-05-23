import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../nano-core'
import { nanoDocumentFromMarkdown } from '../nano-markdown'

const initialMarkdown = `# 현장 기록

오늘은 **비 냄새**와 *시장 소리*가 먼저 남았다. ==과일 상자==는 인도 쪽으로 나와 있었고, ~~괜찮다~~고 쓰려다 지웠다.

- [x] 오전 메모 정리
- [ ] 민아에게 사진 묶음 보내기
- [ ] 금요일 일정 다시 확인

## 시장 골목

\`271\`번 버스가 먼저 지나갔고, 가게 셔터는 반쯤 올라가 있었다.

1. 버스 정류장
2. 과일 가게
3. 사무실 앞

[[시장 골목]]과 #notes 태그로 다음 기록을 묶는다.`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
