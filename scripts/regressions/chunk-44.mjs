import {
  nanoDocumentFromMarkdown,
  nanoDocumentIndex,
  nanoDocumentSearch,
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
} from '../../src/index.ts'
import { assert, test } from './harness.mjs'

test('Public entry exposes Markdown round-trip and document index APIs', () => {
  const markdown = [
    '# 현장 기록',
    '',
    '오늘은 #notes 태그와 [[시장 골목]] 링크를 남긴다.',
    '',
    '- [ ] 정리',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.equal(nanoMarkdownFromDocument(document), markdown)
  assert.deepEqual(
    nanoMarkdownBlocksFromDocument(document).map((entry) => entry.blockId),
    document.blocks.map((block) => block.id),
  )

  const index = nanoDocumentIndex(document)
  assert.deepEqual(index.outline.map((entry) => entry.label), ['현장 기록'])
  assert(index.tags.some((entry) => entry.label === 'notes'))
  assert(index.noteLinks.some((entry) => entry.label === '시장 골목'))

  const search = nanoDocumentSearch(document, '#notes [[시장 골목]]')
  assert(search)
  assert.deepEqual(search.blockIds, ['md-2'])
})
