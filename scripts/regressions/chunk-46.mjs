import { createNanoInputTextHandlers } from '../../src/view/input/text-events.ts'
import * as h from './harness.mjs'

const { assert, nanoBlocksFromProseMirror, nanoMarkdownFromDocument, selectedState, test, textState } = h

function clipboardData(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getData: (type) => values.get(type) ?? '',
    setData: (type, value) => values.set(type, value),
    values,
  }
}

function clipboardEvent(initial = {}) {
  return {
    clipboardData: clipboardData(initial),
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true
    },
  }
}

function inputTextHandlers() {
  return createNanoInputTextHandlers(
    {
      collapsedBlockIds: new Set(),
      shell: {
        openCommandPalette: () => {
          throw new Error('clipboard handlers should not open command palette')
        },
      },
    },
    {
      restoreHistory: () => {},
      runMarkCommand: () => {},
      toggleCollapsedBlock: () => {},
    },
  )
}

function dispatchedView(state) {
  return {
    state,
    dispatch(transaction) {
      this.state = this.state.apply(transaction)
    },
  }
}

function markdownFromView(view) {
  return nanoMarkdownFromDocument({ blocks: nanoBlocksFromProseMirror(view.state.doc) })
}

test('Markdown clipboard paste prefers text/markdown over plain fallback', () => {
  const view = dispatchedView(textState(''))
  const event = clipboardEvent({
    'text/markdown': '# Title',
    'text/plain': 'Title',
  })

  assert.equal(inputTextHandlers().handlePaste(view, event), true)
  assert.equal(event.defaultPrevented, true)
  assert.equal(markdownFromView(view), '# Title')
})

test('Markdown clipboard paste falls back to plain text', () => {
  const view = dispatchedView(textState(''))
  const event = clipboardEvent({
    'text/plain': '- [x] Done',
  })

  assert.equal(inputTextHandlers().handlePaste(view, event), true)
  assert.equal(event.defaultPrevented, true)
  assert.equal(markdownFromView(view), '- [x] Done')
})

test('Markdown clipboard copy writes plain fallback', () => {
  const view = dispatchedView(selectedState('# Copied', 'md-1'))
  const event = clipboardEvent()

  assert.equal(inputTextHandlers().handleCopy(view, event), true)
  assert.equal(event.defaultPrevented, true)
  assert.equal(event.clipboardData.values.get('text/plain'), '# Copied')
  assert.equal(event.clipboardData.values.get('text/markdown'), '# Copied')
})
