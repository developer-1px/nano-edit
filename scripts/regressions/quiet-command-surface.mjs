import { readFileSync } from 'node:fs'
import { blockOptions } from '../../src/nano-block-options.ts'
import { blockActionCommands } from '../../src/nano-command-actions-block.ts'
import { documentActionCommands } from '../../src/nano-command-actions-document.ts'
import { inspectorActionCommands } from '../../src/nano-command-actions-inspector.ts'
import { blockCommands } from '../../src/nano-command-blocks.ts'
import { markCommands } from '../../src/nano-command-marks.ts'
import { assert, test } from './harness.mjs'

function commandOptions(overrides = {}) {
  return {
    activeBlockId: 'md-1',
    blockId: 'md-1',
    canIndentBlock: () => false,
    canMoveBlock: () => false,
    hasTextSelection: false,
    mode: 'global',
    actions: {
      changeBlockById: () => {},
      copyMarkdown: () => {},
      deleteBlock: () => {},
      duplicateBlock: () => {},
      focusMarkdownSource: () => {},
      indentBlock: () => {},
      insertBlock: () => {},
      moveBlock: () => {},
      redo: () => {},
      runMark: () => {},
      showInspector: () => {},
      togglePinnedInspector: () => {},
      undo: () => {},
    },
    ...overrides,
  }
}

test('Inspector commands use compact labels without losing Markdown search terms', () => {
  const commands = inspectorActionCommands(commandOptions())
  assert.deepEqual(
    commands.map((command) => [command.id, command.title, command.hint ?? '']),
    [
      ['source', 'Source', 'Shift Cmd M'],
      ['index', 'Index', ''],
      ['markdown', 'Source', 'Panel'],
      ['pin-inspector', 'Pin', 'Panel'],
    ],
  )
  assert(commands.find((command) => command.id === 'source')?.keywords?.includes('markdown'))
})

test('Command surfaces keep Markdown triggers searchable but visually quiet', () => {
  const commands = blockCommands(commandOptions({ mode: 'global' }))

  assert(commands.every((command) => !command.title.startsWith('Insert ')))
  for (const rawHint of ['#', '##', '[[ ]]', '#tag', '[^1]:', '>', '> [!NOTE]', '```', '$$', '---', '![]()', '[file]()', '| |']) {
    assert.equal(
      commands.some((command) => command.hint === rawHint),
      false,
      `block command should not expose raw Markdown hint: ${rawHint}`,
    )
    assert(
      commands.some((command) => command.keywords?.includes(rawHint)),
      `block command should keep raw Markdown searchable: ${rawHint}`,
    )
  }

  assert.deepEqual(
    blockActionCommands(commandOptions()).map((command) => command.title),
    ['Duplicate', 'Delete', 'Move Up', 'Move Down', 'Indent', 'Outdent'],
  )
  assert.deepEqual(documentActionCommands(commandOptions()).map((command) => command.title), ['Copy'])
  assert(documentActionCommands(commandOptions())[0].keywords.includes('markdown'))

  const markHints = markCommands(commandOptions()).map((command) => command.hint)
  for (const rawHint of ['**', '*', '~', '~~', '==', '`']) {
    assert.equal(markHints.includes(rawHint), false, `mark command should not expose raw Markdown hint: ${rawHint}`)
  }
})

test('Toolbar chrome stays removed without losing command metadata', () => {
  const markdownOptions = blockOptions.filter((option) => option.markdownTrigger)
  assert(markdownOptions.length > 0)
  for (const option of markdownOptions) {
    assert.equal(option.title.includes(option.markdownTrigger), false)
  }

  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const viewCreate = readFileSync(new URL('../../src/nano-view-create.ts', import.meta.url), 'utf8')
  const viewShell = readFileSync(new URL('../../src/nano-view-shell.ts', import.meta.url), 'utf8')
  assert.equal(baseCss.includes('.toolbar'), false)
  assert.equal(baseCss.includes('.block-picker'), false)
  assert.equal(viewCreate.includes('createNanoToolbarRuntime'), false)
  assert.equal(viewCreate.includes('installToolbar'), false)
  assert.equal(viewShell.includes('ctx.toolbar'), false)
  assert.equal(viewShell.includes('ctx.blockPicker'), false)
})

test('Command metadata is not named after removed toolbar chrome', () => {
  const sourceFiles = [
    '../../src/assembly/capability.ts',
    '../../src/nano-block-options.ts',
    '../../src/nano-mark-types.ts',
    '../../src/nano-mark-option-queries.ts',
    '../../src/nano-mark-options.ts',
    '../../src/nano-command-marks.ts',
  ]
    .map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')

  for (const obsoleteName of [
    'BlockToolbar',
    'MarkToolbar',
    'blockToolbarOptions',
    'markToolbarOptions',
    'toolbar?:',
    '.toolbar',
  ]) {
    assert.equal(sourceFiles.includes(obsoleteName), false, `obsolete toolbar model leaked: ${obsoleteName}`)
  }

  assert(sourceFiles.includes('MarkCommandDisplay'))
  assert(sourceFiles.includes('markCommandOptions'))
})
