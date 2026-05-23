import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../nano-core'
import { nanoDocumentFromMarkdown } from '../nano-markdown'

const sampleImageSrc = new URL('../assets/hero.png', import.meta.url).href

const initialMarkdown = `# Field Notes

오늘 기록은 **의미**와 *흐름*만 남긴다. ==확인된 변화==는 남기고, ~~꾸밈말~~은 줄인다.

- [x] 문장 다듬기
- [x] 체크 항목 정리
- [ ] 근거 확인
  - [ ] 사진 캡션
  - [ ] 첨부 파일
- [ ] 다음 검토 예약

1. Collect
2. Trim
3. Send

> [!NOTE] 판단보다 관찰을 먼저 적는다.

## Revision Log

첫 문단은 짧게 둔다. \`draft\` 상태에서는 출처가 있는 문장만 남긴다.

> [!IMPORTANT] 선택지는 넓게 두고, 화면은 낮게 둔다.

## Appendix

| Item | Owner | State |
| --- | --- | --- |
| opening | Mina | ready |
| image | Joon | check |
| appendix | Ara | later |

\`\`\`ts
const note = {
  title: 'Field Notes',
  state: 'draft',
}
\`\`\`

계산은 본문을 끊지 않을 만큼만 둔다: $focus = signal - noise$.

$$
\\text{next} = \\text{evidence} + \\text{revision}
$$

## References

[[Revision Log]]와 #notes 태그는 같은 흐름을 다시 찾게 한다. 근거 문장[^draft]과 [reference](https://example.org/notes "Reference")만 남긴다.

https://example.org/notes

[Field notes](files/field-notes.pdf "PDF")

![working note image](${sampleImageSrc})

[^draft]: 초안의 근거 문장은 다음 검토 때 다시 본다.

---`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
