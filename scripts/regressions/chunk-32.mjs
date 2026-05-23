import { destroyNanoView } from '../../src/nano-view-lifecycle.ts'
import { assert, test } from './harness.mjs'

test('Nano view destroy unmounts once and removes document listeners', () => {
  const originalDocument = globalThis.document
  const removedDocumentListeners = []
  const removedEditorListeners = []
  const calls = { root: 0, shell: 0, view: 0 }
  const listener = () => undefined

  globalThis.document = {
    removeEventListener: (...args) => removedDocumentListeners.push(args),
  }

  try {
    const ctx = {
      destroyed: false,
      editor: {
        removeEventListener: (...args) => removedEditorListeners.push(args),
      },
      root: {
        remove: () => {
          calls.root += 1
        },
      },
      shell: {
        destroy: () => {
          calls.shell += 1
        },
      },
      view: {
        destroy: () => {
          calls.view += 1
        },
      },
      blockAddClickListener: listener,
      blockHandleClickListener: listener,
      blockInsertHoverListener: listener,
      blockInsertKeydownListener: listener,
      gutterOutsideClickListener: listener,
    }

    destroyNanoView(ctx)
    destroyNanoView(ctx)
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = originalDocument
    }
  }

  assert.deepEqual(calls, { root: 1, shell: 1, view: 1 })
  assert.deepEqual(
    removedEditorListeners.map(([eventName]) => eventName),
    ['click', 'click', 'mouseover', 'keydown'],
  )
  assert.deepEqual(
    removedDocumentListeners.map(([eventName]) => eventName),
    ['click'],
  )
})
