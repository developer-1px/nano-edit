import * as h from './harness.mjs'
const { assert, nanoDocumentFromMarkdown, nanoDocumentSearch, test } = h

test('Document search operators combine tags and exclusions', () => {
  const markdown = [
    '- [ ] Ship #work',
    '',
    'Nested #work/project',
    '',
    'Personal #home',
    '',
    '| Tag |',
    '| --- |',
    '| #work/project |',
  ].join('\n')
  const document = nanoDocumentFromMarkdown(markdown)

  assert.deepEqual(nanoDocumentSearch(document, '#work')?.blockIds, ['md-1', 'md-2', 'md-4'])
  assert.deepEqual(nanoDocumentSearch(document, '!#work')?.blockIds, ['md-1'])
  assert.deepEqual(nanoDocumentSearch(document, '#work -@todo')?.blockIds, ['md-2', 'md-4'])
  assert.deepEqual(nanoDocumentSearch(document, '-#work')?.blockIds, ['md-3'])
  assert.deepEqual(nanoDocumentSearch(document, '@tagged')?.blockIds, ['md-1', 'md-2', 'md-3', 'md-4'])
  assert.deepEqual(nanoDocumentSearch(document, '@untagged')?.blockIds, [])
  assert.deepEqual(nanoDocumentSearch(document, '"Nested #work/project"')?.blockIds, ['md-2'])
  assert.deepEqual(nanoDocumentSearch(document, '-"Nested #work/project"')?.blockIds, ['md-1', 'md-3', 'md-4'])
  assert.deepEqual(nanoDocumentSearch(document, 'Ship or Personal')?.blockIds, ['md-1', 'md-3'])
  assert.deepEqual(nanoDocumentSearch(document, '#home or !#work')?.blockIds, ['md-1', 'md-3'])
  assert.deepEqual(nanoDocumentSearch(document, '#work or #home -@todo')?.blockIds, ['md-2', 'md-3', 'md-4'])
})

test('Document search keeps quoted or as a literal term', () => {
  const document = nanoDocumentFromMarkdown([
    'Ship or revise',
    '',
    'Ship only',
  ].join('\n'))

  assert.deepEqual(nanoDocumentSearch(document, '"or"')?.blockIds, ['md-1'])
})

test('Document search keeps quoted special searches as literal terms', () => {
  const document = nanoDocumentFromMarkdown([
    'Literal @todo mention',
    '',
    '- [ ] Task',
  ].join('\n'))

  assert.deepEqual(nanoDocumentSearch(document, '"@todo"')?.blockIds, ['md-1'])
})
