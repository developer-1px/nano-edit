import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../nano-core'
import { nanoDocumentFromMarkdown } from '../nano-markdown'

const initialMarkdown = `# Field Notes

오늘 기록은 **의미**와 *흐름*만 남긴다. ==확인된 변화==는 남기고, ~~꾸밈말~~은 줄인다.

- [x] 문장 다듬기
- [ ] 근거 확인
- [ ] 다음 검토 예약

## Revision Log

첫 문단은 짧게 둔다. \`draft\` 상태에서는 출처가 있는 문장만 남긴다.

1. Collect
2. Trim
3. Send

[[Revision Log]]와 #notes 태그는 같은 흐름을 다시 찾게 한다.`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
