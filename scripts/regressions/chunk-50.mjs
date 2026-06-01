import { editorPartCatalog as publicEditorPartCatalog } from '../../src/index.ts'
import { demoArtifacts } from '../../src/demo/document-library.ts'
import { nanoMarkdownFromDocument } from '../../src/codecs/markdown/nano-markdown.ts'
import * as h from './harness.mjs'

const { assert, editorPartCatalog, test } = h

test('Public API exports the editor part catalog', () => {
  assert.equal(publicEditorPartCatalog.length, editorPartCatalog.length)
  assert.deepEqual(
    publicEditorPartCatalog.map((part) => part.id),
    editorPartCatalog.map((part) => part.id),
  )
})

test('Demo exposes the part catalog as rendered content samples', () => {
  const artifact = demoArtifacts.find((candidate) => candidate.id === 'part-catalog')
  assert(artifact, 'missing part-catalog demo artifact')
  assert.equal(artifact.kind, 'document')

  const blocks = artifact.document.blocks
  const blockTypes = blocks.map((block) => block.type)
  const markdown = nanoMarkdownFromDocument(artifact.document)
  assert(markdown.includes('# Content Catalog'))
  assert(markdown.includes(`engine part ${editorPartCatalog.length}개`))

  for (const type of [
    'paragraph',
    'heading',
    'todo',
    'list_item',
    'quote',
    'callout',
    'code',
    'math',
    'table',
    'divider',
    'image',
    'bookmark',
    'attachment',
    'note_ref',
    'tag_ref',
    'footnote',
  ]) {
    assert(blockTypes.includes(type), `content catalog should render ${type}`)
  }

  const listKinds = blocks
    .filter((block) => block.type === 'list_item')
    .map((block) => block.kind)
  assert(listKinds.includes('bullet'), 'content catalog should render bullet list items')
  assert(listKinds.includes('ordered'), 'content catalog should render ordered list items')

  const markTypes = blocks
    .flatMap((block) => 'marks' in block ? block.marks : [])
    .map((mark) => mark.type)
  for (const type of [
    'bold',
    'italic',
    'underline',
    'strike',
    'highlight',
    'code',
    'link',
    'tag',
    'note_link',
    'math',
    'footnote_ref',
  ]) {
    assert(markTypes.includes(type), `content catalog should render ${type} marks`)
  }

  assert(blocks.some((block) => block.type === 'table' && block.rows.length >= 2))
  assert(blocks.some((block) => block.type === 'image' && block.src.startsWith('data:image/')))
})

test('Demo exposes the standalone inline edit artifact', () => {
  const artifact = demoArtifacts.find((candidate) => candidate.id === 'inline-edit')
  assert(artifact, 'missing inline edit demo artifact')
  assert.equal(artifact.kind, 'inline-edit')
  assert.equal(artifact.title, 'Inline Edit')
})
