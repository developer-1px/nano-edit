import { initialNanoDocument } from '../../src/demo/initial-document.ts'
import { assert, nanoDocumentIndex, nanoMarkdownFromDocument, test } from './harness.mjs'

test('Demo document stays a compact note instead of a feature showcase', () => {
  const markdown = nanoMarkdownFromDocument(initialNanoDocument)
  const forbiddenShowcaseCopy = [
    '/todo',
    '/callout',
    'Cmd+K',
    'current block',
    'floating inspector',
    'markdown clipboard',
    '기능은',
    '토큰은',
    '편집면',
    '기능을 설명',
    '기능 소개 UI',
    'Source Model',
    'round-trip',
    'visual surface',
    'portable markdown',
    'Command map',
    'https://bear.app',
    '## Appendix',
    '$$',
    '![working note image]',
    'https://example.org',
    'files/field-notes.pdf',
    '[^draft]',
    '의미와 흐름',
    '꾸밈말',
    'Revision Log',
    'Collect',
    'Trim',
    'Send',
    '관찰과 순서',
    '첫 문장은 짧게',
    'draft',
  ]
  for (const copy of forbiddenShowcaseCopy) {
    assert.equal(markdown.includes(copy), false, `demo should not expose showcase copy: ${copy}`)
  }
  for (const copy of [
    '[기상청 단기예보](https://www.weather.go.kr/)',
    '![시장 골목 가판](https://images.unsplash.com/',
    '| 항목 | 관찰 | 다음 |',
    '```js',
    '[^photo]: 오후에 받은 사진 묶음 기준.',
  ]) {
    assert(markdown.includes(copy), `demo should include rich note content: ${copy}`)
  }

  const blockTypes = new Set(initialNanoDocument.blocks.map((block) => block.type))
  for (const type of ['heading', 'paragraph', 'todo', 'list_item', 'image', 'table', 'code', 'footnote']) {
    assert(blockTypes.has(type), `demo should keep core note block: ${type}`)
  }
  for (const type of ['callout', 'math', 'bookmark', 'attachment', 'divider']) {
    assert.equal(blockTypes.has(type), false, `demo should not showcase ${type} blocks`)
  }
  assert(initialNanoDocument.blocks.length <= 18, 'demo should stay short enough to read as a note')

  const markTypes = new Set(initialNanoDocument.blocks.flatMap((block) => block.marks?.map((mark) => mark.type) ?? []))
  for (const type of ['bold', 'italic', 'highlight', 'strike', 'code', 'tag', 'note_link', 'link', 'footnote_ref']) {
    assert(markTypes.has(type), `demo should keep quiet inline mark: ${type}`)
  }
  for (const type of ['math']) {
    assert.equal(markTypes.has(type), false, `demo should not showcase ${type} marks`)
  }

  const index = nanoDocumentIndex(initialNanoDocument)
  assert(index.tags.length > 0)
  assert(index.noteLinks.length > 0)
  assert.equal(index.bookmarks.length, 0)
  assert.equal(index.attachments.length, 0)
  assert(index.footnotes.length > 0)
})
