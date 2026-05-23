import { createNanoViewCommandRunners } from '../../src/nano-view-command-runners.ts'
import { assert, test } from './harness.mjs'

function commandRunnersWithDeleteResult(commandResult) {
  const calls = {
    close: 0,
    focus: 0,
    sync: 0,
  }
  const ctx = {
    view: {
      dispatch: () => {},
      focus: () => {
        calls.focus += 1
      },
      state: {},
    },
  }
  const runners = createNanoViewCommandRunners(
    ctx,
    {
      deleteActiveBlockCommand: () => () => commandResult,
    },
    {
      engine: () => ({
        syncSelectionFromDOM: () => {
          calls.sync += 1
        },
      }),
      inspector: {
        focusActiveMarkdownSource: () => false,
      },
      toolbar: () => ({
        closeBlockPicker: () => {
          calls.close += 1
        },
      }),
    },
  )
  return { calls, runners }
}

function commandRunnersWithSourceResult(sourceResult) {
  const calls = {
    close: 0,
    focus: 0,
    source: 0,
    sync: 0,
  }
  const ctx = {
    view: {
      focus: () => {
        calls.focus += 1
      },
    },
  }
  const runners = createNanoViewCommandRunners(
    ctx,
    {},
    {
      engine: () => ({
        syncSelectionFromDOM: () => {
          calls.sync += 1
        },
      }),
      inspector: {
        focusActiveMarkdownSource: () => {
          calls.source += 1
          return sourceResult
        },
      },
      toolbar: () => ({
        closeBlockPicker: () => {
          calls.close += 1
        },
      }),
    },
  )
  return { calls, runners }
}

test('Command runner keeps picker and focus stable when keymap command fails', () => {
  const { calls, runners } = commandRunnersWithDeleteResult(false)

  runners.runDeleteActiveBlock()

  assert.deepEqual(calls, { close: 0, focus: 0, sync: 1 })
})

test('Command runner closes picker and restores focus when keymap command succeeds', () => {
  const { calls, runners } = commandRunnersWithDeleteResult(true)

  runners.runDeleteActiveBlock()

  assert.deepEqual(calls, { close: 1, focus: 1, sync: 1 })
})

test('Source command keeps picker open when source focus fails', () => {
  const { calls, runners } = commandRunnersWithSourceResult(false)

  runners.runFocusActiveMarkdownSource()

  assert.deepEqual(calls, { close: 0, focus: 0, source: 1, sync: 1 })
})

test('Source command closes picker without stealing textarea focus', () => {
  const { calls, runners } = commandRunnersWithSourceResult(true)

  runners.runFocusActiveMarkdownSource()

  assert.deepEqual(calls, { close: 1, focus: 0, source: 1, sync: 1 })
})
