import { createNanoCommandPalette } from '../../src/view/shell/command-palette.ts'
import {
  createAutocomplete,
  createAutocompleteSurface,
  visibleAutocompleteOptions,
} from '../../src/autocomplete/index.ts'
import { assert, test } from './harness.mjs'

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName
    this.children = []
    this.dataset = {}
    this.attributes = new Map()
    this.listeners = []
    this.removedListeners = []
    this.style = {
      removeProperty: () => {},
      setProperty: () => {},
    }
  }

  addEventListener(...args) {
    this.listeners.push(args)
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name) {
    return this.attributes.has(name)
  }

  removeEventListener(...args) {
    this.removedListeners.push(args)
  }

  removeAttribute(name) {
    this.attributes.delete(name)
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }

  append(...children) {
    this.children.push(...children)
  }

  contains(target) {
    return target === this || this.children.includes(target)
  }

  focus() {
    this.focusCount = (this.focusCount ?? 0) + 1
  }

  querySelector(selector) {
    const match = /^\[id="([^"]+)"\]$/.exec(selector)
    if (!match) return null
    return this.children.find((child) => child.id === match[1]) ?? null
  }

  replaceChildren(...children) {
    this.children = children
  }

  scrollIntoView(options) {
    this.scrollIntoViewOptions = options
  }
}

function restoreFakeBrowser({
  originalCancelAnimationFrame,
  originalDocument,
  originalRequestAnimationFrame,
}) {
  if (originalDocument === undefined) {
    delete globalThis.document
  } else {
    globalThis.document = originalDocument
  }
  if (originalRequestAnimationFrame === undefined) {
    delete globalThis.requestAnimationFrame
  } else {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  }
  if (originalCancelAnimationFrame === undefined) {
    delete globalThis.cancelAnimationFrame
  } else {
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame
  }
}

test('Command palette cancels pending focus when destroyed', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  const frames = new Map()
  const canceledFrames = []
  const removedDocumentListeners = []
  let nextFrameId = 1

  globalThis.document = {
    addEventListener: () => {},
    createElement: (tagName) => new FakeElement(tagName),
    removeEventListener: (...args) => removedDocumentListeners.push(args),
  }
  globalThis.requestAnimationFrame = (callback) => {
    const id = nextFrameId
    nextFrameId += 1
    frames.set(id, callback)
    return id
  }
  globalThis.cancelAnimationFrame = (id) => {
    canceledFrames.push(id)
  }

  try {
    const palette = createNanoCommandPalette({
      commandAnchorRect: () => null,
      commands: () => [],
      onCommandClose: () => {
        throw new Error('destroy should not restore editor focus')
      },
    })

    palette.openCommandPalette('global')
    const pendingFrame = frames.get(1)
    palette.destroy()
    palette.openCommandPalette('global')
    pendingFrame()

    assert.deepEqual(canceledFrames, [1])
    assert.equal(palette.commandPalette.children[0].focusCount ?? 0, 0)
    assert.deepEqual(
      palette.commandPalette.children[0].removedListeners.map(([eventName]) => eventName),
      ['keydown', 'input'],
    )
    assert.deepEqual(
      removedDocumentListeners.map(([eventName]) => eventName),
      ['keydown', 'click'],
    )
  } finally {
    restoreFakeBrowser({
      originalCancelAnimationFrame,
      originalDocument,
      originalRequestAnimationFrame,
    })
  }
})

test('Command palette exposes combobox listbox selection state', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame

  globalThis.document = {
    addEventListener: () => {},
    createElement: (tagName) => new FakeElement(tagName),
    removeEventListener: () => {},
  }
  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }
  globalThis.cancelAnimationFrame = () => {}

  try {
    const palette = createNanoCommandPalette({
      commandAnchorRect: () => null,
      commands: () => [
        { id: 'source', title: 'Source', hint: 'Panel', run: () => {} },
        { id: 'copy', title: 'Copy', run: () => {} },
      ],
      onCommandClose: () => {},
    })
    const [input, list] = palette.commandPalette.children

    assert.equal(input.getAttribute('role'), 'combobox')
    assert.equal(input.getAttribute('aria-autocomplete'), 'list')
    assert.equal(input.getAttribute('aria-controls'), list.id)
    assert.equal(input.getAttribute('aria-expanded'), 'false')
    assert.equal(list.getAttribute('role'), 'listbox')

    palette.openCommandPalette('global')

    assert.equal(input.getAttribute('aria-expanded'), 'true')
    assert.equal(input.getAttribute('aria-activedescendant'), list.children[0].id)
    assert.equal(list.children[0].getAttribute('role'), 'option')
    assert.equal(list.children[0].getAttribute('aria-selected'), 'true')
    assert.equal(list.children[0].tabIndex, -1)
    assert.equal(list.children[1].getAttribute('aria-selected'), 'false')

    const keydown = input.listeners.find(([eventName]) => eventName === 'keydown')[1]
    keydown({
      key: 'ArrowDown',
      preventDefault: () => {},
      shiftKey: false,
    })

    assert.equal(input.getAttribute('aria-activedescendant'), list.children[1].id)
    assert.equal(list.children[0].getAttribute('aria-selected'), 'false')
    assert.equal(list.children[1].getAttribute('aria-selected'), 'true')
    assert.deepEqual(list.children[1].scrollIntoViewOptions, { block: 'nearest' })

    palette.destroy()

    assert.equal(input.getAttribute('aria-expanded'), 'false')
    assert.equal(input.hasAttribute('aria-activedescendant'), false)
  } finally {
    restoreFakeBrowser({
      originalCancelAnimationFrame,
      originalDocument,
      originalRequestAnimationFrame,
    })
  }
})

test('Command palette routes global shortcut through interaction ownership', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  const documentListeners = []
  const events = []

  globalThis.document = {
    addEventListener: (...args) => documentListeners.push(args),
    createElement: (tagName) => new FakeElement(tagName),
    removeEventListener: () => {},
  }
  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }
  globalThis.cancelAnimationFrame = () => {}

  try {
    const palette = createNanoCommandPalette({
      commandAnchorRect: () => null,
      commands: () => [
        { id: 'source', title: 'Source', hint: 'Panel', run: () => {} },
      ],
      onCommandClose: () => {},
    })
    const keydown = documentListeners.find(([eventName]) => eventName === 'keydown')?.[1]
    assert.equal(typeof keydown, 'function')

    keydown({
      key: 'k',
      metaKey: true,
      preventDefault: () => events.push('preventDefault'),
      stopPropagation: () => events.push('stopPropagation'),
    })

    assert.equal(palette.commandPalette.hidden, false)
    assert.equal(palette.commandPalette.children[0].getAttribute('aria-expanded'), 'true')
    assert.deepEqual(events, ['preventDefault', 'stopPropagation'])

    palette.destroy()
  } finally {
    restoreFakeBrowser({
      originalCancelAnimationFrame,
      originalDocument,
      originalRequestAnimationFrame,
    })
  }
})

test('Autocomplete core owns query selection without DOM', () => {
  const autocomplete = createAutocomplete({
    options: (_context, query) => visibleAutocompleteOptions([
      { id: 'alpha', title: 'Alpha', keywords: ['first'] },
      { id: 'beta', title: 'Beta', disabled: true },
      { id: 'gamma', title: 'Gamma', keywords: ['third'] },
    ], query),
  })

  autocomplete.open({ trigger: '/' })
  assert.equal(autocomplete.state().open, true)
  assert.equal(autocomplete.selectedOption()?.id, 'alpha')

  autocomplete.move(1)
  assert.equal(autocomplete.selectedOption()?.id, 'gamma')

  autocomplete.setQuery('third')
  assert.equal(autocomplete.state().query, 'third')
  assert.equal(autocomplete.state().visibleOptions.length, 1)
  assert.equal(autocomplete.selectedOption()?.id, 'gamma')

  autocomplete.close()
  assert.equal(autocomplete.state().open, false)
  assert.equal(autocomplete.selectedOption(), null)
})

test('Autocomplete surface works without Nano command objects', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  const runs = []

  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
  }
  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }
  globalThis.cancelAnimationFrame = () => {}

  try {
    const surface = createAutocompleteSurface({
      ariaLabel: 'Mention',
      options: (_context, query) => visibleAutocompleteOptions([
        { id: 'ada', title: 'Ada Lovelace', hint: '@ada', keywords: ['engine'] },
        { id: 'alan', title: 'Alan Turing', hint: '@alan' },
      ], query),
      placeholder: (context) => context.trigger,
      position: (root, context) => {
        root.dataset.trigger = context.trigger
      },
      run: (option, context) => runs.push([option.id, context.trigger]),
    })
    const [input, list] = surface.root.children

    surface.open({ trigger: '@' }, 'engine')

    assert.equal(input.getAttribute('role'), 'combobox')
    assert.equal(input.getAttribute('aria-autocomplete'), 'list')
    assert.equal(input.getAttribute('aria-expanded'), 'true')
    assert.equal(input.getAttribute('aria-activedescendant'), list.children[0].id)
    assert.equal(input.ariaLabel, 'Mention')
    assert.equal(input.placeholder, '@')
    assert.equal(input.value, 'engine')
    assert.equal(surface.state().query, 'engine')
    assert.equal(surface.selectedOption().id, 'ada')
    assert.equal(surface.root.dataset.trigger, '@')
    assert.equal(list.getAttribute('role'), 'listbox')
    assert.equal(list.children[0].getAttribute('aria-selected'), 'true')
    assert.equal(list.children[0].tabIndex, -1)

    surface.setQuery('alan')

    assert.equal(list.children.length, 1)
    assert.equal(input.getAttribute('aria-activedescendant'), list.children[0].id)
    assert.equal(surface.state().query, 'alan')
    assert.equal(surface.selectedOption().id, 'alan')

    surface.runSelected()

    assert.deepEqual(runs, [['alan', '@']])
    assert.equal(surface.root.hidden, true)
    assert.equal(input.getAttribute('aria-expanded'), 'false')

    surface.destroy()
  } finally {
    restoreFakeBrowser({
      originalCancelAnimationFrame,
      originalDocument,
      originalRequestAnimationFrame,
    })
  }
})
