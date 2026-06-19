import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { markdownLinkAt } from '../../src/codecs/markdown/link/parse.ts'
import { initialNanoDocument } from '../../src/demo/initial-document.ts'
import { packageImportSpecifier, publicPackageSubpathExportKeys } from '../package-artifact-graph.mjs'
import { assert, nanoDocumentIndex, nanoMarkdownFromDocument, test } from './harness.mjs'

const stalePublicPositioningTerms = []

test('Demo document describes Nano Edit as a generated-looking document', () => {
  const markdown = nanoMarkdownFromDocument(initialNanoDocument)
  assert(markdown.startsWith('# Nano Edit\n\n'), 'demo should use Nano Edit as the document title')
  const requiredSelfDescription = [
    '# Nano Edit',
    'embeddable editor package',
    'LLM이 생성한 Markdown',
    '공식 기술문서처럼 읽게 하고',
    '필요한 일부만 조용히 수정',
    'quiet local edit loop',
    'Capability profile',
    'Capability',
    'View feature',
    'Catalog',
    'Nano Document',
    'Markdown codec',
    'capabilityProfile',
    'describeNanoCapabilityProfile',
    'default preset',
    'Catalog Model',
    'Agent-Selected Profile',
    'schema와 codec도 descriptor에서 조립',
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
    'https://placeholder.invalid',
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
    assert.equal(markdown.includes(copy), false, `demo should stay document-like and avoid stale sample copy: ${copy}`)
  }
  assertNoStalePublicPositioning(markdown, 'demo document')

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
  assert(initialNanoDocument.blocks.length <= 80, 'demo should stay document-like without becoming a fake docs surface')

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

test('Public positioning docs name Nano Edit directly', () => {
  for (const file of publicPositioningDocumentUrls()) {
    const source = readFileSync(file, 'utf8')
    assertNoStalePublicPositioning(source, file.pathname)
  }
})

test('Public contract docs list current package subpath entries', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  const publicSubpathSpecifiers = publicPackageSubpathExportKeys(packageJson)
    .map((key) => packageImportSpecifier(packageJson, key))
  const allowedPackageSubpathSpecifiers = new Set(
    publicPackageSubpathExportKeys(packageJson, { includeStyle: true })
      .map((key) => packageImportSpecifier(packageJson, key)),
  )

  for (const file of packageSubpathContractDocumentUrls()) {
    const source = readFileSync(file, 'utf8')
    for (const specifier of publicSubpathSpecifiers) {
      assert(source.includes(`\`${specifier}\``), `${file.pathname} should list current package subpath entry: ${specifier}`)
    }
    for (const match of source.matchAll(/`([^`]+)`/g)) {
      if (!match[1].startsWith(`${packageJson.name}/`)) continue
      assert(allowedPackageSubpathSpecifiers.has(match[1]), `${file.pathname} should not list stale package subpath entry: ${match[1]}`)
    }
  }
})

test('Repo docs avoid local absolute file paths', () => {
  const files = repoMarkdownDocumentUrls()

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const localAbsolutePath = /(?:\/Users\/|\/home\/|file:\/\/|[A-Za-z]:\\)/.exec(source)
    assert.equal(
      localAbsolutePath,
      null,
      `${file.pathname} should use relative links instead of local absolute paths: ${localAbsolutePath?.[0]}`,
    )
  }
})

test('Repo docs local Markdown links resolve', () => {
  const files = repoMarkdownDocumentUrls()

  for (const file of files) {
    const source = stripMarkdownCode(readFileSync(file, 'utf8'))
    for (const target of localMarkdownLinkTargets(source)) {
      const targetUrl = new URL(target, file)
      assert(existsSync(targetUrl), `${file.pathname} should link to an existing local target: ${target}`)
    }
  }
})

test('Repo docs local Markdown link parser preserves destinations that need Markdown parsing', () => {
  assert.deepEqual(
    localMarkdownLinkTargets('[Spec](<docs/spec with spaces.md#section>) [Titled](docs/readme.md "title") [Paren](docs/spec(v2).md#section) [Remote](https://example.com) [Anchor](#top)'),
    ['docs/spec with spaces.md', 'docs/readme.md', 'docs/spec(v2).md'],
  )
})

function repoMarkdownDocumentUrls() {
  return [
    new URL('../../README.md', import.meta.url),
    new URL('../../CONTEXT.md', import.meta.url),
    ...markdownFiles(new URL('../../docs/', import.meta.url)),
  ]
}

function publicPositioningDocumentUrls() {
  return [
    ...repoMarkdownDocumentUrls(),
    new URL('../../src/demo/initial-document.ts', import.meta.url),
  ]
}

function packageSubpathContractDocumentUrls() {
  return [
    new URL('../../README.md', import.meta.url),
  ]
}

function assertNoStalePublicPositioning(source, label) {
  const lowerSource = source.toLowerCase()
  for (const term of stalePublicPositioningTerms) {
    assert.equal(
      lowerSource.includes(term.toLowerCase()),
      false,
      `${label} should not reintroduce stale public positioning term: ${term}`,
    )
  }
}

function markdownFiles(directoryUrl) {
  const files = []
  for (const entry of readdirSync(directoryUrl, { withFileTypes: true })) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl)
    if (entry.isDirectory()) {
      files.push(...markdownFiles(entryUrl))
    } else if (entry.name.endsWith('.md')) {
      files.push(entryUrl)
    }
  }
  return files
}

function stripMarkdownCode(source) {
  return source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
}

function localMarkdownLinkTargets(source) {
  const targets = []
  for (let index = 0; index < source.length; index += 1) {
    const link = markdownLinkAt(source, index)
    if (!link) continue
    const target = localMarkdownLinkTarget(link.href)
    if (target) targets.push(target)
    index = link.to - 1
  }
  return targets
}

function localMarkdownLinkTarget(href) {
  let target = href.trim()
  target = target.split('#')[0]
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return null
  return target
}
