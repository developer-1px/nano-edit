import type { NanoDocument } from '../entities/document/nano-document-model'
import { nanoDocumentFromMarkdown } from '../codecs/markdown/nano-markdown-parse'

const nano2Markdown = `# Nano2

Nano2는 json-document를 원본으로 두고, DOM input과 selection은 ProseMirror EditorView 런타임에 맡긴다.

이 문장을 직접 고쳐 보면 DOM input이 NanoDocument change로 들어간다.

## Smoke

- 첫 문단을 편집한다
- Enter로 새 문단을 만든다
- Cmd/Ctrl+Z로 json-document history를 되돌린다`

export const nano2DemoDocument: NanoDocument = nanoDocumentFromMarkdown(nano2Markdown)
