import { syncFoldIndicatorStates } from '../../src/view/block-ui/fold-indicator.ts'
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

test('Fold state sync keeps heading names free of fold control text', () => {
  class FakeClassList {
    constructor(element) {
      this.element = element
    }

    contains(className) {
      return this.element.className.split(/\s+/).includes(className)
    }
  }

  class FakeElement {
    constructor(className, parent = null, attrs = {}) {
      this.className = className
      this.parent = parent
      this.attrs = { ...attrs }
      this.children = []
      this.childNodes = this.children
      this.classList = new FakeClassList(this)
    }

    append(...children) {
      this.children.push(...children)
      for (const child of children) child.parent = this
    }

    closest(selector) {
      if (selector !== '.nano-block') return null
      let element = this
      while (element) {
        if (element.classList.contains('nano-block')) return element
        element = element.parent
      }
      return null
    }

    querySelector(selector) {
      if (selector !== '.nano-block-content') return null
      return this.children.find((child) => child.classList.contains('nano-block-content')) ?? null
    }

    setAttribute(name, value) {
      this.attrs[name] = String(value)
    }

    getAttribute(name) {
      if (name === 'class') return this.className
      return this.attrs[name] ?? null
    }

    hasAttribute(name) {
      return this.attrs[name] !== undefined
    }

    removeAttribute(name) {
      delete this.attrs[name]
    }
  }

  class FakeText {
    constructor(text) {
      this.nodeType = 3
      this.textContent = text
    }
  }

  const heading = new FakeElement('nano-block nano-heading nano-heading-collapsible')
  const fold = new FakeElement('nano-heading-fold', heading)
  const content = new FakeElement('nano-block-content', heading)
  content.append(new FakeText('Visible '), new FakeElement('nano-note-link nano-source-token', content, { 'data-label': 'Heading' }))
  heading.append(fold, content)
  const root = {
    querySelectorAll(selector) {
      if (selector === '.nano-heading-fold, .nano-list-fold') return [fold]
      if (selector === '.nano-heading') return [heading]
      return []
    },
  }

  syncFoldIndicatorStates(root)
  assert.equal(heading.attrs['aria-label'], 'Visible Heading')
  assert.equal(fold.attrs['aria-label'], 'Collapse section')

  content.children.splice(0, content.children.length, new FakeText('Renamed Heading'))
  syncFoldIndicatorStates(root)
  assert.equal(heading.attrs['aria-label'], 'Renamed Heading')

  content.children.splice(0, content.children.length, new FakeText(''), new FakeElement('nano-source-token', content, { 'aria-hidden': 'true' }))
  syncFoldIndicatorStates(root)
  assert.equal(heading.attrs['aria-label'], undefined)
})
