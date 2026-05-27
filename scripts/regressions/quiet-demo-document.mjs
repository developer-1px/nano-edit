import { initialNanoDocument } from '../../src/demo/initial-document.ts'
import { assert, nanoDocumentIndex, nanoMarkdownFromDocument, test } from './harness.mjs'

test('Demo document describes Nano Edit as a generated-looking document', () => {
  const markdown = nanoMarkdownFromDocument(initialNanoDocument)
  const requiredSelfDescription = [
    '# Nano Edit',
    'embeddable editor package',
    'LLM이 생성한 Markdown',
    '공식 기술문서처럼 읽게 하고',
    '필요한 일부만 조용히 수정',
    'quiet local edit loop',
    'Editor Kit',
    'Capability',
    'View feature',
    'Catalog',
    'Nano Document',
    'Markdown codec',
    'createNanoEditorKit',
    'default preset',
    'Catalog Model',
    'Agent-Selected Kit',
    'schema와 codec도 kit에서 조립',
    'Try It In This Document',
    '[[Nano Edit Demo]]',
    '#generated-markdown',
    '[^surface]: 데모 문서는 사용법과 구조를 설명할 수 있지만',
  ]
  for (const copy of requiredSelfDescription) {
    assert(markdown.includes(copy), `demo should explain Nano Edit through document content: ${copy}`)
  }

  const forbiddenNonDocumentCopy = [
    '/todo',
    '/callout',
    'Cmd+K',
    'current block',
    'floating inspector',
    'Command palette',
    'toolbar',
    'block picker',
    '기능 소개 UI',
    'Command map',
    'https://bear.app',
    '## Appendix',
    '$$',
    '![working note image]',
    'https://example.org',
    'files/field-notes.pdf',
    '[^draft]',
    'Revision Log',
    'Collect',
    'Trim',
    'Send',
    '현장 기록',
    '시장 골목',
    '기상청 단기예보',
    '관찰과 순서',
    'draft',
  ]
  for (const copy of forbiddenNonDocumentCopy) {
    assert.equal(markdown.includes(copy), false, `demo should stay document-like and avoid stale showcase/sample copy: ${copy}`)
  }

  assert(markdown.includes('| Concept | 현재 역할 | 조립 엔진에서의 의미 |'))
  assert(markdown.includes('| Part id | Surface | Status | Pairs with | Why it exists |'))
  assert(markdown.includes('```ts'))
  assert(markdown.includes('![Nano Edit icon](/favicon.svg)'))
  assert(markdown.includes('[CommonMark](https://spec.commonmark.org/0.31.2/)'))

  const blockTypes = new Set(initialNanoDocument.blocks.map((block) => block.type))
  for (const type of ['heading', 'paragraph', 'callout', 'todo', 'list_item', 'image', 'table', 'code', 'footnote']) {
    assert(blockTypes.has(type), `demo should keep core self-describing document block: ${type}`)
  }
  for (const type of ['math', 'bookmark', 'attachment', 'divider']) {
    assert.equal(blockTypes.has(type), false, `demo should not add decorative ${type} blocks`)
  }
  assert(initialNanoDocument.blocks.length <= 80, 'demo should stay document-like without becoming a fake docs app')

  const markTypes = new Set(initialNanoDocument.blocks.flatMap((block) => block.marks?.map((mark) => mark.type) ?? []))
  for (const type of ['bold', 'italic', 'highlight', 'strike', 'code', 'tag', 'note_link', 'link', 'footnote_ref']) {
    assert(markTypes.has(type), `demo should keep representative quiet inline mark: ${type}`)
  }
  for (const type of ['math']) {
    assert.equal(markTypes.has(type), false, `demo should not add decorative ${type} marks`)
  }

  const index = nanoDocumentIndex(initialNanoDocument)
  assert(index.tags.length > 0)
  assert(index.noteLinks.length > 0)
  assert.equal(index.bookmarks.length, 0)
  assert.equal(index.attachments.length, 0)
  assert(index.footnotes.length > 0)
})
