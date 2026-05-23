import { assert, blockDomSpec, test } from './harness.mjs'

function specText(spec) {
  if (typeof spec === 'string') return spec
  if (!Array.isArray(spec)) return ''
  return spec.map(specText).join('')
}

function specHasClass(spec, className) {
  if (!Array.isArray(spec)) return false
  const attrs = spec[1] && typeof spec[1] === 'object' && !Array.isArray(spec[1]) ? spec[1] : null
  if (typeof attrs?.class === 'string' && attrs.class.split(/\s+/).includes(className)) return true
  return spec.some((child) => specHasClass(child, className))
}

test('Fold indicators use lucide icons instead of text markers', () => {
  const foldSpecs = [
    blockDomSpec({ id: 'heading', type: 'heading', level: 2, text: 'Title', marks: [] }),
    blockDomSpec({ id: 'list', type: 'list_item', kind: 'bullet', indent: 0, text: 'Item', marks: [] }),
    blockDomSpec({ id: 'todo', type: 'todo', checked: false, indent: 0, text: 'Task', marks: [] }),
  ]

  for (const spec of foldSpecs) {
    assert(specHasClass(spec, 'nano-fold-icon'))
    assert.equal(specText(spec).includes('>'), false)
  }
})
