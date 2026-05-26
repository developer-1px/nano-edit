import { initialNanoDocument } from '../../src/demo/initial-document.ts'
import { assert, nanoDocumentIndex, nanoMarkdownFromDocument, test } from './harness.mjs'

test('Demo document describes Nano Edit as a generated-looking document', () => {
  const markdown = nanoMarkdownFromDocument(initialNanoDocument)
  const requiredSelfDescription = [
    '# Nano Edit',
    'embeddable editor package',
    'AI가 만든 Markdown 문서',
    '문서처럼 읽게 하고',
    '필요한 부분만 조용히 고칠 수',
    'quiet local edit loop',
    '더 많은 Markdown 표현',
    'Nano Document',
    'Markdown codec',
    'ProseMirror view',
    'zod-crud',
    'Local edit loop',
    'undo와 persistence',
    '한번 고쳐보기',
    '[[Nano Edit Demo]]',
    '#generated-markdown',
    '[^demo]: 데모 문서는 사용법을 설명할 수 있지만',
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

  assert(markdown.includes('| 영역 | 역할 | 편집 중 보이는 것 |'))
  assert(markdown.includes('```ts'))
  assert(markdown.includes('![Nano Edit icon](/favicon.svg)'))
  assert(markdown.includes('[Live Markdown spec](https://spec.commonmark.org/0.31.2/)'))

  const blockTypes = new Set(initialNanoDocument.blocks.map((block) => block.type))
  for (const type of ['heading', 'paragraph', 'todo', 'list_item', 'image', 'table', 'code', 'footnote']) {
    assert(blockTypes.has(type), `demo should keep core self-describing document block: ${type}`)
  }
  for (const type of ['callout', 'math', 'bookmark', 'attachment', 'divider']) {
    assert.equal(blockTypes.has(type), false, `demo should not add decorative ${type} blocks`)
  }
  assert(initialNanoDocument.blocks.length <= 28, 'demo should stay short enough to read as a generated document')

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
