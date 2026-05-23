import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../nano-core'
import { nanoDocumentFromMarkdown } from '../nano-markdown'

const initialMarkdown = `# Field Notes

오늘은 **관찰**과 *순서*만 적는다. ==비가 그친 뒤== 공기가 가벼웠고, ~~괜찮다~~는 말은 줄였다.

- [x] 오전 메모 정리
- [ ] 민아에게 사진 묶음 보내기
- [ ] 금요일 일정 다시 확인

## 시장 골목

첫 문장은 짧게 둔다. \`draft\`에는 들은 말과 본 장면만 남긴다.

1. 버스 정류장
2. 과일 가게
3. 사무실 앞

[[시장 골목]]과 #notes 태그로 다음 기록을 묶는다.`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
