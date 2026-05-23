import { createNanoViewCommandRunners } from '../../src/nano-view-command-runners.ts'
import { assert, test } from './harness.mjs'

function commandRunnersWithDeleteResult(commandResult) {
  const calls = {
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
    },
  )
  return { calls, runners }
}

function commandRunnersWithSourceResult(sourceResult) {
  const calls = {
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
    },
  )
  return { calls, runners }
}

test('Command runner keeps focus stable when keymap command fails', () => {
  const { calls, runners } = commandRunnersWithDeleteResult(false)

  runners.runDeleteActiveBlock()

  assert.deepEqual(calls, { focus: 0, sync: 1 })
})

test('Command runner restores focus when keymap command succeeds', () => {
  const { calls, runners } = commandRunnersWithDeleteResult(true)

  runners.runDeleteActiveBlock()

  assert.deepEqual(calls, { focus: 1, sync: 1 })
})

test('Source command leaves editor focus alone when source focus fails', () => {
  const { calls, runners } = commandRunnersWithSourceResult(false)

  runners.runFocusActiveMarkdownSource()

  assert.deepEqual(calls, { focus: 0, source: 1, sync: 1 })
})

test('Source command does not steal textarea focus', () => {
  const { calls, runners } = commandRunnersWithSourceResult(true)

  runners.runFocusActiveMarkdownSource()

  assert.deepEqual(calls, { focus: 0, source: 1, sync: 1 })
})
