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

function specByClass(spec, className) {
  if (!Array.isArray(spec)) return null
  const attrs = spec[1] && typeof spec[1] === 'object' && !Array.isArray(spec[1]) ? spec[1] : null
  if (typeof attrs?.class === 'string' && attrs.class.split(/\s+/).includes(className)) return spec

  for (const child of spec) {
    const match = specByClass(child, className)
    if (match) return match
  }
  return null
}

test('Fold indicators use lucide icons instead of text markers', () => {
  const foldSpecs = [
    ['nano-heading-fold', blockDomSpec({ id: 'heading', type: 'heading', level: 2, text: 'Title', marks: [] })],
    ['nano-list-fold', blockDomSpec({ id: 'list', type: 'list_item', kind: 'bullet', indent: 0, text: 'Item', marks: [] })],
    ['nano-list-fold', blockDomSpec({ id: 'todo', type: 'todo', checked: false, indent: 0, text: 'Task', marks: [] })],
  ]

  for (const [className, spec] of foldSpecs) {
    const fold = specByClass(spec, className)

    assert(fold)
    assert.equal(fold[1].role, 'button')
    assert.equal(fold[1].tabindex, '0')
    assert.equal(fold[1]['aria-label'], 'Toggle section')
    assert.equal(fold[1]['aria-hidden'], undefined)
    assert(specHasClass(spec, 'nano-fold-icon'))
    assert.equal(specText(spec).includes('>'), false)
  }
})
