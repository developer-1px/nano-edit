import { initialNanoDocument } from '../../src/demo/initial-document.ts'
import { blockActionCommands } from '../../src/nano-command-actions-block.ts'
import { documentActionCommands } from '../../src/nano-command-actions-document.ts'
import { inspectorActionCommands } from '../../src/nano-command-actions-inspector.ts'
import { blockOptionTitle } from '../../src/nano-block-ui-elements.ts'
import { blockOptions } from '../../src/nano-block-options.ts'
import { blockCommands } from '../../src/nano-command-blocks.ts'
import { markCommands } from '../../src/nano-command-marks.ts'
import { inspectorIndexSections } from '../../src/nano-view-inspector-index-sections.ts'
import { indexEntrySymbol } from '../../src/nano-view-index.ts'
import { assert, blockDomSpec, deleteBlockSyntaxTransaction, markdownAfter, nanoDocumentFromMarkdown, nanoDocumentIndex, nanoMarkdownFromDocument, test, textSelectionState } from './harness.mjs'
import { readFileSync } from 'node:fs'

test('Demo document stays quiet while covering visual Markdown surfaces', () => {
  const markdown = nanoMarkdownFromDocument(initialNanoDocument)
  const forbiddenShowcaseCopy = [
    '/todo',
    '/callout',
    'Cmd+K',
    'current block',
    'floating inspector',
    'markdown clipboard',
    '기능은',
    '토큰은',
    '편집면',
    '기능을 설명',
    '기능 소개 UI',
    'Source Model',
    'round-trip',
    'visual surface',
    'portable markdown',
    'Command map',
  ]
  for (const copy of forbiddenShowcaseCopy) {
    assert.equal(markdown.includes(copy), false, `demo should not expose showcase copy: ${copy}`)
  }

  const blockTypes = new Set(initialNanoDocument.blocks.map((block) => block.type))
  for (const type of ['heading', 'paragraph', 'todo', 'list_item', 'callout', 'table', 'code', 'math', 'bookmark', 'attachment', 'image', 'footnote', 'divider']) {
    assert(blockTypes.has(type), `demo should cover ${type} blocks`)
  }

  const markTypes = new Set(initialNanoDocument.blocks.flatMap((block) => block.marks?.map((mark) => mark.type) ?? []))
  for (const type of ['bold', 'italic', 'highlight', 'strike', 'code', 'math', 'tag', 'note_link', 'link', 'footnote_ref']) {
    assert(markTypes.has(type), `demo should cover ${type} marks`)
  }

  const index = nanoDocumentIndex(initialNanoDocument)
  assert(index.tags.length > 0)
  assert(index.noteLinks.length > 0)
  assert(index.bookmarks.length > 0)
  assert(index.attachments.length > 0)
  assert(index.footnotes.length > 0)
})

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

test('Block picker keeps raw Markdown triggers out of visible chrome', () => {
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const inspectorShell = readFileSync(new URL('../../src/nano-inspector-shell.ts', import.meta.url), 'utf8')
  assert(css.includes('.block-picker-option::after,\n.nano-block-insert-option::after'))
  assert(css.includes('content: attr(data-md);\n  display: none;'))
  assert(css.includes('.nano-block-insert-picker::before {\n  content: attr(data-query);\n  display: none;'))
  assert.equal(css.includes('.nano-block-insert-option:hover::after'), false)
  assert.equal(css.includes('content: "/" attr(data-query);'), false)
  assert.equal(inspectorShell.includes('@todo #tag [[note]]'), false)
  assert(inspectorShell.includes("placeholder = 'Search'"))
})

test('Gutter and toolbar labels stay compact without raw Markdown trigger titles', () => {
  const markdownOptions = blockOptions.filter((option) => option.markdownTrigger)
  assert(markdownOptions.length > 0)
  for (const option of markdownOptions) {
    assert.equal(blockOptionTitle(option).includes(option.markdownTrigger), false)
  }

  const blockUiElements = readFileSync(new URL('../../src/nano-block-ui-elements.ts', import.meta.url), 'utf8')
  const toolbarRuntime = readFileSync(new URL('../../src/nano-view-toolbar-runtime.ts', import.meta.url), 'utf8')
  const toolbarPicker = readFileSync(new URL('../../src/nano-view-toolbar-picker.ts', import.meta.url), 'utf8')
  for (const noisy of ['Move Block', 'Duplicate Block', 'Delete Block', 'Edit Source', 'Copy Markdown', 'Insert Block Type', 'Change Block']) {
    assert.equal(toolbarRuntime.includes(noisy), false)
    assert.equal(blockUiElements.includes(noisy), false)
    assert.equal(toolbarPicker.includes(noisy), false)
  }
  assert.equal(toolbarRuntime.includes("button('MD'"), false)
  assert(toolbarRuntime.includes("button('⎘', 'Copy'"))
  assert(blockUiElements.includes("addButton.title = 'Add'"))
  assert(blockUiElements.includes("handle.title = 'Move'"))
  assert(blockUiElements.includes("button.dataset.md = option.markdownTrigger ?? ''"))
})

test('Inline Markdown delimiters stay hidden on hover and focus', () => {
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const hoverRule = /\.nano-md-token:hover::before,[\s\S]*?\.nano-md-token:focus-within::after \{([\s\S]*?)\n\}/.exec(css)
  assert(hoverRule, 'inline delimiter hover/focus rule should be present')
  assert(hoverRule[1].includes('width: 0;'))
  assert(hoverRule[1].includes('opacity: 0;'))
  assert.equal(hoverRule[1].includes('width: auto;'), false)
})

test('Accessible chrome avoids Markdown jargon outside explicit source actions', () => {
  const dividerSpec = blockDomSpec({ id: 'divider', type: 'divider' })
  assert.equal(dividerSpec[1]['aria-label'], 'Divider')
  assert.equal(dividerSpec[1]['aria-label'].includes('Markdown'), false)

  const inspectorMarkdown = readFileSync(new URL('../../src/nano-view-inspector-markdown.ts', import.meta.url), 'utf8')
  const inspectorShell = readFileSync(new URL('../../src/nano-inspector-shell.ts', import.meta.url), 'utf8')
  assert.equal(inspectorMarkdown.includes('`${entry.blockId} markdown`'), false)
  assert(inspectorMarkdown.includes('`${entry.blockId} source`'))
  assert.equal(inspectorShell.includes("labeledSection('markdown'"), false)
  assert(inspectorShell.includes("labeledSection('source'"))
})

test('Inspector chrome uses icon elements instead of text placeholders', () => {
  const inspectorShell = readFileSync(new URL('../../src/nano-inspector-shell.ts', import.meta.url), 'utf8')
  const inspectorEntry = readFileSync(new URL('../../src/nano-view-inspector-index-entry.ts', import.meta.url), 'utf8')
  const inspectorCss = readFileSync(new URL('../../src/styles/inspector.css', import.meta.url), 'utf8')

  assert(inspectorShell.includes("from 'lucide'"))
  assert(inspectorShell.includes("shellButton('', 'Index', ListTree)"))
  assert(inspectorShell.includes("shellButton('', 'Source', FileCode2)"))
  assert(inspectorShell.includes("lucideIconElement(PanelRightOpen"))
  assert(inspectorEntry.includes("lucideIconElement(indexEntryIcon(action), 'nano-index-icon')"))
  assert.equal(inspectorCss.includes("content: 'i';"), false)
  assert.equal(inspectorCss.includes("content: 's';"), false)
  assert.equal(inspectorCss.includes("content: 'p';"), false)
  assert.equal(inspectorCss.includes("content: 'x';"), false)
  assert.equal(inspectorCss.includes('content: attr(data-index-symbol);'), false)
})

test('Document surface does not depend on GitHub markdown viewer CSS', () => {
  const main = readFileSync(new URL('../../src/main.ts', import.meta.url), 'utf8')
  const viewCreate = readFileSync(new URL('../../src/nano-view-create.ts', import.meta.url), 'utf8')
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8')

  assert.equal(main.includes('github-markdown-css'), false)
  assert.equal(packageJson.includes('github-markdown-css'), false)
  assert(viewCreate.includes("class: 'nano-document'"))
  assert.equal(viewCreate.includes('markdown-body'), false)
  assert(baseCss.includes('.ProseMirror.nano-document'))
  assert.equal(baseCss.includes('markdown-body'), false)
})

test('Inspector index uses visual labels instead of raw Markdown markers', () => {
  const index = nanoDocumentIndex(nanoDocumentFromMarkdown([
    '## Closed title ###',
    '- [x] Done #work',
    '- [ ] Later',
    '[[Release Notes]]',
    '#projects/editor',
    '> [!TIP] dense',
    '',
    'Inline $E=mc^2$ and ref[^1] with [Bear](https://bear.app "Bear Home").',
    '',
    '[^1]: detail',
  ].join('\n')))
  const sections = inspectorIndexSections(index)
  const todos = sections.find((section) => section.title === 'todos')?.entries.map((entry) => entry.label)

  assert.deepEqual(todos, ['✓ Done #work', '□ Later'])
  assert(index.outline.some((entry) => entry.label === 'Closed title'))
  assert(index.noteLinks.some((entry) => entry.label === 'Release Notes' && entry.target === '[[Release Notes]]'))
  assert(index.tags.some((entry) => entry.label === 'work' && entry.target === '#work'))
  assert(index.tags.some((entry) => entry.label === 'projects/editor' && entry.target === '#projects/editor'))
  assert(index.callouts.some((entry) => entry.label === 'Tip: dense'))
  assert(index.math.some((entry) => entry.label === 'E=mc^2'))
  assert(index.footnotes.some((entry) => entry.label.startsWith('1') && entry.target === '[^1]'))
  assert(index.externalLinks.some((entry) => entry.label === 'Bear' && entry.target === 'https://bear.app'))
  assert.equal(index.tags.some((entry) => entry.label.startsWith('#')), false)
  for (const entry of [
    ...index.outline,
    ...index.noteLinks,
    ...index.callouts,
    ...index.math,
    ...index.footnotes,
    ...index.externalLinks,
  ]) {
    assert.equal(/^(?:#+|>\s*\[!|\[\[|\[\^|\$\$?|!\[|\[.+\]\()/.test(entry.label), false, `raw label leaked: ${entry.label}`)
  }
  for (const symbol of ['tag', 'note', 'select'].map((action) => indexEntrySymbol(action))) {
    assert.equal(['#', '[[', '-'].includes(symbol), false)
  }
})

test('Delete at visual block start edits hidden Markdown markers like Backspace', () => {
  const headingState = textSelectionState('### Title', 'md-1', 0)
  assert.equal(markdownAfter(headingState, deleteBlockSyntaxTransaction(headingState)), '## Title')

  const todoState = textSelectionState('- [ ] task', 'md-1', 0)
  assert.equal(markdownAfter(todoState, deleteBlockSyntaxTransaction(todoState)), '- task')

  const bulletState = textSelectionState('- task', 'md-1', 0)
  assert.equal(markdownAfter(bulletState, deleteBlockSyntaxTransaction(bulletState)), 'task')

  const quoteState = textSelectionState('> quote', 'md-1', 0)
  assert.equal(markdownAfter(quoteState, deleteBlockSyntaxTransaction(quoteState)), 'quote')

  const calloutState = textSelectionState('> [!TIP] callout', 'md-1', 0)
  assert.equal(markdownAfter(calloutState, deleteBlockSyntaxTransaction(calloutState)), '> callout')

  const footnoteState = textSelectionState('[^n]: body', 'md-1', 0)
  assert.equal(markdownAfter(footnoteState, deleteBlockSyntaxTransaction(footnoteState)), 'body')

  const codeState = textSelectionState('```js\nconst value is one\n```', 'md-1', 0)
  assert.equal(markdownAfter(codeState, deleteBlockSyntaxTransaction(codeState)), 'const value is one')

  const mathState = textSelectionState('$$\na+b\n$$', 'md-1', 0)
  assert.equal(markdownAfter(mathState, deleteBlockSyntaxTransaction(mathState)), 'a+b')
})
