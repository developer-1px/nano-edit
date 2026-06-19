import {
  nanoDocumentFromMarkdown,
  nanoDocumentIndex,
  nanoDocumentSearch,
  nanoMarkdownBlockDiff,
  nanoMarkdownBlockDiffEntries,
  nanoMarkdownBlocksFromDocument,
  nanoMarkdownFromDocument,
  nanoTextBlockFromMarkdown,
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

test('Public document index APIs reject invalid Nano documents', () => {
  assert.throws(() => nanoDocumentIndex({
    blocks: [],
  }))
  assert.throws(() => nanoDocumentSearch({
    blocks: [{ id: 'bad', type: 'paragraph', text: 'Short', marks: [{ type: 'bold', from: 0, to: 10 }] }],
  }, 'Short'))
})

test('Markdown per-block entries expose fresh parse positional ids', () => {
  const before = nanoMarkdownBlocksFromDocument(nanoDocumentFromMarkdown([
    'Alpha',
    '',
    'Beta',
  ].join('\n')))
  const after = nanoMarkdownBlocksFromDocument(nanoDocumentFromMarkdown([
    'Alpha',
    '',
    'Inserted',
    '',
    'Beta',
  ].join('\n')))

  assert.deepEqual(before.map((entry) => [entry.blockId, entry.markdown]), [
    ['md-1', 'Alpha'],
    ['md-2', 'Beta'],
  ])
  assert.deepEqual(after.map((entry) => [entry.blockId, entry.markdown]), [
    ['md-1', 'Alpha'],
    ['md-2', 'Inserted'],
    ['md-3', 'Beta'],
  ])
  assert.equal(before[1].markdown, after[2].markdown)
  assert.notEqual(before[1].blockId, after[2].blockId)
})

test('Markdown text-block helper refreshes one host composer block with marks', () => {
  const block = nanoTextBlockFromMarkdown(
    'Reviewer note [[Renewal Runbook]] #retention-risk',
    { id: 'review-note' },
  )
  assert(block)
  assert.equal(block.id, 'review-note')
  assert.equal(block.type, 'paragraph')

  const index = nanoDocumentIndex({ blocks: [block] })
  assert(index.noteLinks.some((entry) => entry.label === 'Renewal Runbook'))
  assert(index.tags.some((entry) => entry.label === 'retention-risk'))
})

test('Markdown block diff anchors unchanged blocks across positional id shifts', () => {
  const before = [
    'Alpha',
    '',
    'Beta',
    '',
    'Gamma',
  ].join('\n')
  const after = [
    'Alpha',
    '',
    'Inserted',
    '',
    'Beta',
    '',
    'Gamma edited',
  ].join('\n')

  const diff = nanoMarkdownBlockDiff(before, after)

  assert.deepEqual(diff.added.map((entry) => entry.markdown), ['Inserted'])
  assert.deepEqual(diff.edited.map((entry) => [entry.before.markdown, entry.after.markdown]), [
    ['Gamma', 'Gamma edited'],
  ])
  assert.deepEqual(diff.removed.map((entry) => entry.markdown), [])
  assert.deepEqual(diff.unchanged.map((entry) => [entry.before.markdown, entry.after.markdown]), [
    ['Alpha', 'Alpha'],
    ['Beta', 'Beta'],
  ])
  assert.equal(diff.identity, 'markdown-lcs-position')
})

test('Markdown block diff accepts precomputed block entries', () => {
  const before = nanoMarkdownBlocksFromDocument(nanoDocumentFromMarkdown('One\n\nTwo'))
  const after = nanoMarkdownBlocksFromDocument(nanoDocumentFromMarkdown('One\n\nTwo\n\nThree'))

  assert.deepEqual(nanoMarkdownBlockDiffEntries(before, after).added.map((entry) => entry.markdown), ['Three'])
})
