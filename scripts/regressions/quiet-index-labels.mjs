import { inspectorIndexSections } from '../../src/view/inspector/index-sections.ts'
import { indexEntrySymbol } from '../../src/view/index-view/index.ts'
import { assert, nanoDocumentFromMarkdown, nanoDocumentIndex, test } from './harness.mjs'

test('Inspector index uses visual labels instead of raw Markdown markers', () => {
  const index = nanoDocumentIndex(nanoDocumentFromMarkdown([
    '## Closed title ###',
    '- [x] Done #work',
    '- [ ] Later',
    '[[Release Notes]]',
    '#projects/editor',
    '> [!TIP] dense',
    '',
    'Inline $E=mc^2$ and ref[^1] with [Bear](https://bear.app "Bear Home").',
    '',
    '[^1]: detail',
  ].join('\n')))
  const sections = inspectorIndexSections(index)
  const todos = sections.find((section) => section.title === 'todos')?.entries.map((entry) => entry.label)

  assert.deepEqual(todos, ['✓ Done #work', '□ Later'])
  assert(index.outline.some((entry) => entry.label === 'Closed title'))
  assert(index.noteLinks.some((entry) => entry.label === 'Release Notes' && entry.target === '[[Release Notes]]'))
  assert(index.tags.some((entry) => entry.label === 'work' && entry.target === '#work'))
  assert(index.tags.some((entry) => entry.label === 'projects/editor' && entry.target === '#projects/editor'))
  assert(index.callouts.some((entry) => entry.label === 'Tip: dense'))
  assert(index.math.some((entry) => entry.label === 'E=mc^2'))
  assert(index.footnotes.some((entry) => entry.label.startsWith('1') && entry.target === '[^1]'))
  assert(index.externalLinks.some((entry) => entry.label === 'Bear' && entry.target === 'https://bear.app'))
  assert.equal(index.tags.some((entry) => entry.label.startsWith('#')), false)
  for (const entry of [
    ...index.outline,
    ...index.noteLinks,
    ...index.callouts,
    ...index.math,
    ...index.footnotes,
    ...index.externalLinks,
  ]) {
    assert.equal(/^(?:#+|>\s*\[!|\[\[|\[\^|\$\$?|!\[|\[.+\]\()/.test(entry.label), false, `raw label leaked: ${entry.label}`)
  }
  for (const symbol of ['tag', 'note', 'select'].map((action) => indexEntrySymbol(action))) {
    assert.equal(['#', '[[', '-'].includes(symbol), false)
  }
})
