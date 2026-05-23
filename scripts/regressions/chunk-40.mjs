import { readFileSync } from 'node:fs'
import { assert, blockDomSpec, test } from './harness.mjs'

function specText(spec) {
  if (typeof spec === 'string') return spec
  if (!Array.isArray(spec)) return ''
  return spec.map(specText).join('')
}

test('Decorative Markdown tokens stay out of document text', () => {
  const todoText = specText(blockDomSpec({
    id: 'todo',
    type: 'todo',
    checked: true,
    checkedMarker: 'X',
    indent: 0,
    text: 'Done',
    marks: [],
  }))
  const footnoteText = specText(blockDomSpec({
    id: 'footnote',
    type: 'footnote',
    name: 'draft',
    text: 'Source detail',
    marks: [],
  }))
  const css = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const hiddenBlockTokenRule = /\.nano-block-md-prefix,[\s\S]*?\.nano-table-markdown \{([\s\S]*?)\n\}/.exec(css)

  assert.equal(todoText.includes('- [X]'), false)
  assert.equal(todoText.includes('- [ ]'), false)
  assert.equal(footnoteText.includes('[^draft]:'), false)
  assert(hiddenBlockTokenRule, 'hidden block source token rule should be present')
  assert(hiddenBlockTokenRule[1].includes('display: none;'))
  assert.equal(hiddenBlockTokenRule[1].includes('position: absolute;'), false)
})
