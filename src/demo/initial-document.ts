import { createNanoDocument, type NanoDocument, type NanoDocumentEngine } from '../core/nano-core'
import { nanoDocumentFromMarkdown } from '../codecs/markdown/nano-markdown'

const initialMarkdown = `# 현장 기록

오늘은 **비 냄새**와 *시장 소리*가 먼저 남았다. ==과일 상자==는 인도 쪽으로 나와 있었고, ~~괜찮다~~고 쓰려다 지웠다.

> 비는 약했지만, 골목 냄새가 먼저 왔다.

- [x] 오전 메모 정리
- [ ] 민아에게 사진 묶음 보내기
- [ ] 금요일 일정 다시 확인

## 시장 골목

\`271\`번 버스가 먼저 지나갔고, 가게 셔터는 반쯤 올라가 있었다. [기상청 단기예보](https://www.weather.go.kr/)는 비를 낮게 잡았다.

1. 버스 정류장
2. 과일 가게
3. 사무실 앞

![시장 골목 가판](https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=960&q=80)

| 항목 | 관찰 | 다음 |
| --- | --- | --- |
| 과일 상자 | 보행선 밖 | 위치 확인 |
| 셔터 | 반쯤 열림 | 오후 재방문 |
| 버스 | 271번 | 시간 기록 |

\`\`\`js
const note = {
  place: '시장 골목',
  weather: '비',
  followUp: ['사진 정리', '시간 확인'],
}
\`\`\`

## 정리

[[시장 골목]]과 #notes 태그로 다음 기록을 묶는다. 사진은 원본과 캡션을 같이 둔다.[^photo]

[^photo]: 오후에 받은 사진 묶음 기준.`

export const initialNanoDocument: NanoDocument = nanoDocumentFromMarkdown(initialMarkdown)

export function createDemoNanoDocument(): NanoDocumentEngine {
  return createNanoDocument(initialNanoDocument)
}
