import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../nano-core'
import { nanoDocumentFromMarkdown } from '../nano-markdown'

const sampleImageSrc = new URL('../assets/hero.png', import.meta.url).href

const initialMarkdown = `# Field Notes

#editor #notes [[Release Notes]]

오늘 메모는 **의미**와 *흐름*만 남긴다. ==중요한 변화==는 남기고, ~~설명용 장식~~은 지운다.

- [x] 문장 다듬기
- [x] 체크 항목 정리
- [ ] 인용 확인
  - [ ] 사진 캡션
  - [ ] 첨부 파일

1. Collect
2. Trim
3. Send

> [!NOTE] 작성 중인 문장은 그대로 두고, 표시만 낮춘다.[^draft]

## Release Notes

첫 문단은 짧게 유지한다. \`draft\` 상태에서는 근거가 보이는 문장만 남긴다.

| Item | Owner | State |
| --- | --- | --- |
| opening | Mina | ready |
| image | Joon | check |
| appendix | Ara | later |

> [!IMPORTANT] 선택지는 넓고, 표면은 낮다.

## Draft

\`\`\`ts
const note = {
  title: 'Field Notes',
  state: 'draft',
}
\`\`\`

Inline math keeps the estimate compact: $focus = signal - noise$.

$$
\\text{next} = \\text{evidence} + \\text{revision}
$$

## References

[[Release Notes]]와 #editor 태그는 같은 흐름을 다시 찾게 한다. [Bear](https://bear.app)는 가까운 기준점이다.

https://bear.app

[Field notes](files/field-notes.pdf "PDF")

![working note image](${sampleImageSrc})

[^draft]: 초안의 근거 문장은 다음 검토 때 다시 본다.

---`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
