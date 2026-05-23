import { syncFoldIndicatorStates } from '../../src/nano-fold-indicator.ts'
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
    assert.equal(fold[1].role, undefined)
    assert.equal(fold[1].tabindex, '-1')
    assert.equal(fold[1]['aria-hidden'], 'true')
    assert.equal(fold[1]['aria-expanded'], undefined)
    assert(specHasClass(spec, 'nano-fold-icon'))
    assert.equal(specText(spec).includes('>'), false)
  }
})

test('Fold indicators expose expanded state only when a section is collapsible', () => {
  class FakeClassList {
    constructor(element) {
      this.element = element
    }

    contains(className) {
      return this.element.className.split(/\s+/).includes(className)
    }
  }

  class FakeElement {
    constructor(className, parent = null) {
      this.className = className
      this.parent = parent
      this.attrs = {}
      this.classList = new FakeClassList(this)
    }

    closest(selector) {
      if (selector === '.nano-block') return this.parent
      return null
    }

    setAttribute(name, value) {
      this.attrs[name] = String(value)
    }

    getAttribute(name) {
      return this.attrs[name] ?? null
    }

    hasAttribute(name) {
      return this.attrs[name] !== undefined
    }

    removeAttribute(name) {
      delete this.attrs[name]
    }
  }

  const block = new FakeElement('nano-block nano-heading-collapsible')
  const fold = new FakeElement('nano-heading-fold', block)
  const root = {
    querySelectorAll: (selector) => selector === '.nano-heading-fold, .nano-list-fold' ? [fold] : [],
  }

  syncFoldIndicatorStates(root)
  assert.equal(fold.attrs.role, 'button')
  assert.equal(fold.attrs.tabindex, '0')
  assert.equal(fold.attrs['aria-hidden'], undefined)
  assert.equal(fold.attrs['aria-expanded'], 'true')
  assert.equal(fold.attrs['aria-label'], 'Collapse section')

  block.className = 'nano-block nano-heading-collapsible nano-heading-collapsed'
  syncFoldIndicatorStates(root)
  assert.equal(fold.attrs['aria-expanded'], 'false')
  assert.equal(fold.attrs['aria-label'], 'Expand section')

  block.className = 'nano-block nano-heading'
  syncFoldIndicatorStates(root)
  assert.equal(fold.attrs.role, undefined)
  assert.equal(fold.attrs.tabindex, '-1')
  assert.equal(fold.attrs['aria-hidden'], 'true')
  assert.equal(fold.attrs['aria-expanded'], undefined)
})
