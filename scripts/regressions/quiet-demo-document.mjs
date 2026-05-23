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
    '```',
    '$$',
    '![working note image]',
    'https://example.org',
    'files/field-notes.pdf',
    '[^draft]',
  ]
  for (const copy of forbiddenShowcaseCopy) {
    assert.equal(markdown.includes(copy), false, `demo should not expose showcase copy: ${copy}`)
  }

  const blockTypes = new Set(initialNanoDocument.blocks.map((block) => block.type))
  for (const type of ['heading', 'paragraph', 'todo', 'list_item']) {
    assert(blockTypes.has(type), `demo should keep core note block: ${type}`)
  }
  for (const type of ['callout', 'table', 'code', 'math', 'bookmark', 'attachment', 'image', 'footnote', 'divider']) {
    assert.equal(blockTypes.has(type), false, `demo should not showcase ${type} blocks`)
  }
  assert(initialNanoDocument.blocks.length <= 12, 'demo should stay short enough to read as a note')

  const markTypes = new Set(initialNanoDocument.blocks.flatMap((block) => block.marks?.map((mark) => mark.type) ?? []))
  for (const type of ['bold', 'italic', 'highlight', 'strike', 'code', 'tag', 'note_link']) {
    assert(markTypes.has(type), `demo should keep quiet inline mark: ${type}`)
  }
  for (const type of ['math', 'link', 'footnote_ref']) {
    assert.equal(markTypes.has(type), false, `demo should not showcase ${type} marks`)
  }

  const index = nanoDocumentIndex(initialNanoDocument)
  assert(index.tags.length > 0)
  assert(index.noteLinks.length > 0)
  assert.equal(index.bookmarks.length, 0)
  assert.equal(index.attachments.length, 0)
  assert.equal(index.footnotes.length, 0)
})
