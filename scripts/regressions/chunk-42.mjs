import { refreshInspector } from '../../src/view/engine/sync.ts'
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
  }
}

test('Refresh inspector updates document side panels without toolbar chrome', () => {
  const calls = { index: 0, markdown: 0 }

  refreshInspector({
    engine: { history: { canRedo: false, canUndo: true } },
  }, refreshDeps(calls))

  assert.deepEqual(calls, { index: 1, markdown: 1 })

  refreshInspector({
    engine: { history: { canRedo: true, canUndo: false } },
  }, refreshDeps(calls))

  assert.deepEqual(calls, { index: 2, markdown: 2 })
})
