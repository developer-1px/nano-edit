import { refreshInspector } from '../../src/nano-view-engine-sync.ts'
import { assert, test } from './harness.mjs'

function refreshDeps(calls) {
  return {
    inspector: {
      renderIndex: () => {
        calls.index += 1
      },
      renderMarkdown: () => {
        calls.markdown += 1
      },
    },
    toolbar: {
      refreshToolbarState: () => {
        calls.toolbar += 1
      },
    },
  }
}

function toolbarWithHistoryButtons(buttons) {
  return {
    querySelector(selector) {
      const action = /^\[data-action="(.+)"\]$/.exec(selector)?.[1]
      return action ? buttons[action] ?? null : null
    },
  }
}

test('Refresh inspector updates history buttons without requiring toolbar chrome', () => {
  const calls = { index: 0, markdown: 0, toolbar: 0 }
  const undo = { disabled: false }
  const redo = { disabled: false }

  refreshInspector({
    engine: { history: { canRedo: false, canUndo: true } },
    toolbar: toolbarWithHistoryButtons({ undo, redo }),
  }, refreshDeps(calls))

  assert.deepEqual(calls, { index: 1, markdown: 1, toolbar: 1 })
  assert.equal(undo.disabled, false)
  assert.equal(redo.disabled, true)

  refreshInspector({
    engine: { history: { canRedo: true, canUndo: false } },
    toolbar: toolbarWithHistoryButtons({}),
  }, refreshDeps(calls))

  assert.deepEqual(calls, { index: 2, markdown: 2, toolbar: 2 })
})
