import { readFileSync } from 'node:fs'
import {
  assert,
  blockDomSpec,
  blockPositionById,
  EditorState,
  nanoSchema,
  markdownCopyTextFromSelection,
  prosemirrorDocFromNano,
  test,
  TextSelection,
} from './harness.mjs'
import { sourceRevealDecorations } from '../../src/nano-source-reveal-plugin.ts'

test('Hidden block picker chrome stays removed', () => {
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const blockUi = readFileSync(new URL('../../src/nano-block-ui-decorations.ts', import.meta.url), 'utf8')
  const slashRuntime = readFileSync(new URL('../../src/nano-view-slash-command-runtime.ts', import.meta.url), 'utf8')
  const viewCreate = readFileSync(new URL('../../src/nano-view-create.ts', import.meta.url), 'utf8')
  const lifecycle = readFileSync(new URL('../../src/nano-view-lifecycle.ts', import.meta.url), 'utf8')
  const inputPlugins = readFileSync(new URL('../../src/nano-view-input-plugins.ts', import.meta.url), 'utf8')
  const inspectorShell = readFileSync(new URL('../../src/nano-inspector-shell.ts', import.meta.url), 'utf8')
  assert.equal(css.includes('block-picker-option'), false)
  assert.equal(css.includes('content: attr(data-md);'), false)
  assert.equal(css.includes('nano-block-insert'), false)
  assert.equal(blockUi.includes('Decoration.widget'), false)
  assert.equal(slashRuntime.includes('createNanoGutterPickerRuntime'), false)
  assert.equal(slashRuntime.includes('handleBlockDrag'), false)
  assert.equal(viewCreate.includes('Gutter'), false)
  assert.equal(lifecycle.includes('Gutter'), false)
  for (const dragSurface of ['dragstart', 'dragover', 'dragend', 'drop:', 'clearBlockDragState', 'nano-drop-before', 'nano-block-drag-source']) {
    assert.equal(inputPlugins.includes(dragSurface), false)
    assert.equal(editorCss.includes(dragSurface), false)
  }
  assert.equal(css.includes('content: "/" attr(data-query);'), false)
  assert.equal(inspectorShell.includes('@todo #tag [[note]]'), false)
  assert(inspectorShell.includes("placeholder = 'Search'"))
})

test('Inline Markdown syntax reveal is focus and selection scoped', () => {
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const inlineCss = readFileSync(new URL('../../src/styles/inline-tokens.css', import.meta.url), 'utf8')
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const sourceReveal = readFileSync(new URL('../../src/nano-source-reveal-plugin.ts', import.meta.url), 'utf8')
  const quietRule = /\.nano-md-token::before,[\s\S]*?\.nano-md-token::after \{([\s\S]*?)\n\}/.exec(inlineCss)
  assert(quietRule, 'inline delimiter quiet rule should be present')
  assert(quietRule[1].includes('position: absolute;'))
  assert(quietRule[1].includes('width: 0;'))
  assert(quietRule[1].includes('height: 0;'))
  assert(quietRule[1].includes('opacity: 0;'))
  assert(quietRule[1].includes('white-space: pre;'))
  assert.equal(quietRule[1].includes('display: inline-block;'), false)
  assert(inlineCss.includes('.nano-source-widget'))
  assert(inlineCss.includes('.nano-inline-source-marker'))
  assert(sourceReveal.includes('Decoration.widget'))
  assert(sourceReveal.includes('sourceRevealPluginKey'))
  assert(sourceReveal.includes('focus: (view)'))
  assert(sourceReveal.includes('blur: (view)'))
  assert.equal(inlineCss.includes('.nano-block-active .nano-md-token::before'), false)
  assert.equal(inlineCss.includes('.nano-block-active .nano-md-token::after'), false)
  assert.equal(inlineCss.includes('.nano-block-active .nano-tag.nano-source-token'), false)
  assert.equal(/^\.nano-md-token:hover/m.test(css), false)
  assert.equal(css.includes('.nano-md-token:focus-within'), false)
  assert(editorCss.includes('.nano-block-source-marker'))
  assert(editorCss.includes('position: absolute;'))
  assert(editorCss.includes('var(--nano-source-lane)'))
  assert.equal(editorCss.includes('overflow: hidden;'), false)
  assert(inlineCss.includes('.nano-inline-source-replaced'))
  assert(inlineCss.includes('.nano-source-token-active::before'))
  const replacedRule = /\.nano-inline-source-replaced \{([\s\S]*?)\n\}/.exec(inlineCss)
  const inlineSourceMarkerRule = /\.nano-inline-source-marker \{([\s\S]*?)\n\}/.exec(inlineCss)
  const activeSourceTokenRule = /\.nano-tag\.nano-source-token\.nano-source-token-active::before,[\s\S]*?\.nano-raw-external-link\.nano-source-token\.nano-source-token-active\[data-syntax='autolink'\]::before \{([\s\S]*?)\n\}/.exec(inlineCss)
  assert(replacedRule)
  assert(inlineSourceMarkerRule)
  assert(activeSourceTokenRule)
  assert.equal(replacedRule[1].includes('display: none;'), false)
  assert(inlineSourceMarkerRule[1].includes('position: absolute;'))
  assert(inlineSourceMarkerRule[1].includes('height: 1em;'))
  assert(inlineSourceMarkerRule[1].includes('overflow: hidden;'))
  assert(inlineSourceMarkerRule[1].includes('pointer-events: none;'))
  assert.equal(inlineSourceMarkerRule[1].includes('display: inline;'), false)
  assert(activeSourceTokenRule[1].includes('visibility: hidden;'))
  assert.equal(activeSourceTokenRule[1].includes('content: none;'), false)
  assert.equal(editorCss.includes('.nano-block-active .nano-block-md-prefix'), false)
  assert.equal(editorCss.includes('.nano-block-active .nano-callout-marker'), false)
})

test('Source reveal decorations stay empty before editor focus', () => {
  const state = inlineRevealState(1)
  const decorations = sourceRevealDecorations(state, { focused: false })
  assert.deepEqual(sourceTokens(decorations), [])
})

test('Inline source reveal only exposes the mark touched by the cursor', () => {
  const state = inlineRevealState(1)
  const tokens = sourceTokens(sourceRevealDecorations(state, { focused: true }))
  assert.deepEqual(tokens, ['**', '**'])
})

test('Inline source reveal ignores unrelated marks in the same block', () => {
  const state = inlineRevealState(5)
  const tokens = sourceTokens(sourceRevealDecorations(state, { focused: true }))
  assert.deepEqual(tokens, [])
})

test('Inline source-token reveal replaces only the active token', () => {
  const doc = prosemirrorDocFromNano({
    blocks: [{
      id: 'b1',
      type: 'paragraph',
      text: 'See project and alias',
      marks: [
        { type: 'tag', from: 4, to: 11, name: 'project' },
        { type: 'note_link', from: 16, to: 21, target: 'Target', alias: 'alias' },
      ],
    }],
  })
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1 + 7),
  })
  const decorations = sourceRevealDecorations(state, { focused: true })
  assert.deepEqual(sourceTokens(decorations), ['#project'])
  assert.deepEqual(
    decorations.find()
      .map((decoration) => decoration.spec)
      .filter((spec) => spec.nanoSourceKind === 'inline-replacement-range')
      .map((spec) => spec.nanoSourceToken),
    ['#project'],
  )
})

test('Block source markers use a lane and stay active-block scoped', () => {
  const doc = prosemirrorDocFromNano({
    blocks: [
      { id: 'h1', type: 'heading', level: 2, text: 'Title', marks: [] },
      { id: 'p1', type: 'paragraph', text: 'Body', marks: [] },
    ],
  })
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1),
  })
  assert.deepEqual(sourceTokens(sourceRevealDecorations(state, { focused: true })), ['## '])
})

test('List and todo source markers reveal as quiet active indicators', () => {
  const doc = prosemirrorDocFromNano({
    blocks: [
      { id: 'l1', type: 'list_item', kind: 'ordered', text: 'One', marks: [] },
      { id: 't1', type: 'todo', checked: false, text: 'Task', marks: [] },
    ],
  })
  const listPosition = blockPositionById(doc, 'l1')
  const todoPosition = blockPositionById(doc, 't1')
  assert.notEqual(listPosition, null)
  assert.notEqual(todoPosition, null)

  const listState = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, listPosition + 1),
  })
  const todoState = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, todoPosition + 1),
  })

  assert.deepEqual(sourceTokens(sourceRevealDecorations(listState, { focused: true })), ['1. '])
  assert.deepEqual(sourceTokens(sourceRevealDecorations(todoState, { focused: true })), ['- [ ] '])
})

test('Source reveal focus transactions do not touch the zod-crud engine path', () => {
  const dispatcher = readFileSync(new URL('../../src/nano-view-engine-dispatch.ts', import.meta.url), 'utf8')
  assert(dispatcher.includes('sourceRevealPluginKey'))
  assert(dispatcher.includes('transaction.getMeta(sourceRevealPluginKey)'))
  assert(dispatcher.indexOf('transaction.getMeta(sourceRevealPluginKey)') < dispatcher.indexOf('restoreNanoSelection(ctx, selection)'))
})

test('Partial multi-block copy returns Markdown instead of browser default ambiguity', () => {
  const doc = prosemirrorDocFromNano({
    blocks: [
      { id: 'p1', type: 'paragraph', text: 'alpha beta', marks: [{ type: 'bold', from: 6, to: 10 }] },
      { id: 'p2', type: 'paragraph', text: 'gamma delta', marks: [] },
    ],
  })
  const state = EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1 + 6, 1 + doc.child(0).nodeSize + 5),
  })

  assert.equal(markdownCopyTextFromSelection(state), '**beta**\n\ngamma')
})

function inlineRevealState(offset) {
  const doc = prosemirrorDocFromNano({
    blocks: [{
      id: 'b1',
      type: 'paragraph',
      text: 'one two three',
      marks: [
        { type: 'bold', from: 0, to: 3 },
        { type: 'italic', from: 8, to: 13, marker: '_' },
      ],
    }],
  })
  return EditorState.create({
    schema: nanoSchema,
    doc,
    selection: TextSelection.create(doc, 1 + offset),
  })
}

function sourceTokens(decorations) {
  return decorations.find()
    .map((decoration) => decoration.spec)
    .filter((spec) => spec.nanoSourceKind !== 'inline-replacement-range')
    .map((spec) => spec.nanoSourceToken)
    .filter((token) => typeof token === 'string')
}

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
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const prosemirrorCss = readFileSync(new URL('../../src/styles/prosemirror.css', import.meta.url), 'utf8')
  const viewCreate = readFileSync(new URL('../../src/nano-view-create.ts', import.meta.url), 'utf8')
  const viewAttributes = readFileSync(new URL('../../src/nano-view-editor-attributes.ts', import.meta.url), 'utf8')
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

  assert.equal(main.includes('github-markdown-css'), false)
  assert.equal(main.includes('prosemirror-view/style/prosemirror.css'), false)
  assert.equal(JSON.stringify(packageJson).includes('github-markdown-css'), false)
  assert.equal(packageJson.exports['./style.css'], './src/style.css')
  assert(packageJson.sideEffects.includes('**/*.css'))
  assert(css.includes("@import './styles/prosemirror.css';"))
  assert(prosemirrorCss.includes('.nano .ProseMirror {'))
  assert(prosemirrorCss.includes('white-space: break-spaces;'))
  assert.equal(prosemirrorCss.includes('.ProseMirror-selectednode {\n  outline: 2px solid #8cf;'), false)
  assert(viewCreate.includes('createNanoEditorAttributes(options)'))
  assert(viewAttributes.includes("class: 'nano-document'"))
  assert(viewAttributes.includes('DEFAULT_NANO_EDITOR_ARIA_LABEL'))
  assert(baseCss.includes('.nano-editor'))
  assert.equal(baseCss.includes('.editor'), false)
  assert.equal(viewCreate.includes('markdown-body'), false)
  assert(baseCss.includes('.ProseMirror.nano-document'))
  assert(baseCss.includes('.nano .ProseMirror-selectednode'))
  assert.equal(baseCss.includes('#8cf'), false)
  assert.equal(baseCss.includes('markdown-body'), false)
})

test('Demo host language matches the compact Korean note', () => {
  const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  assert(indexHtml.includes('<html lang="ko">'))
  assert.equal(indexHtml.includes('<html lang="en">'), false)
})

test('Base styles stay scoped to the nano surface', () => {
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const demoHostCss = readFileSync(new URL('../../src/styles/demo-host.css', import.meta.url), 'utf8')
  const main = readFileSync(new URL('../../src/main.ts', import.meta.url), 'utf8')
  const nanoRule = /^\.nano \{([\s\S]*?)\n\}/m.exec(baseCss)

  assert(nanoRule, 'nano root rule should be present')
  assert(nanoRule[1].includes('--nano-bg: #ffffff;'))
  assert(nanoRule[1].includes('font-family: var(--nano-sans);'))
  assert.equal(baseCss.includes(':root'), false)
  assert.equal(/^body \{/m.test(baseCss), false)
  assert.equal(/^html,/m.test(baseCss), false)
  assert.equal(/^#app[,\s{]/m.test(baseCss), false)
  assert.equal(/^button[,\s{]/m.test(baseCss), false)
  assert.equal(/^input[,\s{]/m.test(baseCss), false)
  assert.equal(/^textarea[,\s{]/m.test(baseCss), false)
  assert.equal(/^\* \{/m.test(baseCss), false)
  assert(baseCss.includes('.nano,\n.nano * {'))
  assert(baseCss.includes('.nano button,\n.nano input,\n.nano textarea {'))
  assert(baseCss.includes('.nano button:focus-visible,'))
  assert(baseCss.includes('.nano .ProseMirror:focus-visible'))
  assert(demoHostCss.includes('body {'))
  assert(demoHostCss.includes('#app {'))
  assert(main.includes("import './styles/demo-host.css'"))
})

test('Document surface wraps prose without emergency breaking by default', () => {
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const inlineCss = readFileSync(new URL('../../src/styles/inline-tokens.css', import.meta.url), 'utf8')
  const documentRule = /\.ProseMirror\.nano-document \{([\s\S]*?)\n\}/.exec(baseCss)
  const blockContentRule = /\.nano-block-content \{([\s\S]*?)\n\}/.exec(editorCss)
  const inlineTokenRule = /\.nano-md-token \{([\s\S]*?)\n\}/.exec(inlineCss)
  const inlineSourceLabelRule = /\.nano-tag\.nano-source-token::before,[\s\S]*?\.nano-raw-external-link\.nano-source-token\[data-syntax='autolink'\]::before \{([\s\S]*?)\n\}/.exec(inlineCss)
  const inlineSourceHiddenRule = /\.nano-tag\.nano-source-token > \[aria-hidden='true'\],[\s\S]*?\.nano-raw-external-link\.nano-source-token\[data-syntax='autolink'\] > \[aria-hidden='true'\] \{([\s\S]*?)\n\}/.exec(inlineCss)
  const referenceTitleRule = /\.nano-bookmark-title,[\s\S]*?\.nano-tag-ref-title \{([\s\S]*?)\n\}/.exec(editorCss)
  const referenceDetailRule = /\.nano-bookmark-detail,[\s\S]*?\.nano-bookmark-url \{([\s\S]*?)\n\}/.exec(editorCss)

  assert(documentRule, 'document rule should be present')
  assert(blockContentRule, 'block content rule should be present')
  assert(inlineTokenRule, 'inline token rule should be present')
  assert(inlineSourceLabelRule, 'inline source label rule should be present')
  assert(inlineSourceHiddenRule, 'inline source hidden syntax rule should be present')
  assert(referenceTitleRule, 'reference title rule should be present')
  assert(referenceDetailRule, 'reference detail rule should be present')

  for (const rule of [documentRule, blockContentRule, inlineTokenRule, referenceTitleRule, referenceDetailRule]) {
    assert(rule[1].includes('overflow-wrap: break-word;'))
    assert.equal(rule[1].includes('overflow-wrap: anywhere;'), false)
  }
  assert(inlineSourceLabelRule[1].includes('font-size: inherit;'))
  assert(inlineSourceHiddenRule[1].includes('display: none;'))
  assert.equal(inlineCss.includes('font-size: 0;'), false)
  assert.equal(editorCss.includes('font-size: 0;'), false)
  assert.equal(editorCss.includes('.nano-footnote-marker::before'), false)
  assert.equal(inlineSourceLabelRule[1].includes('font-size: 1rem;'), false)
})

test('Document surface keeps tables and callouts visually quiet', () => {
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const tableCellRule = /\.nano-document th,\n\.nano-document td \{([\s\S]*?)\n\}/.exec(baseCss)
  const calloutRule = [...editorCss.matchAll(/\.nano-document \.nano-callout \{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((body) => body.includes('display: grid;'))
  const calloutIconRule = /\.nano-callout-icon \{([\s\S]*?)\n\}/.exec(editorCss)

  assert(tableCellRule, 'table cell rule should be present')
  assert(tableCellRule[1].includes('border: 0;'))
  assert(tableCellRule[1].includes('border-bottom: 1px solid var(--nano-border);'))
  assert.equal(tableCellRule[1].includes('border: 1px solid'), false)

  assert(calloutRule, 'callout rule should be present')
  assert(calloutRule.includes('display: grid;'))
  assert(calloutRule.includes('grid-template-columns: 1em minmax(0, 1fr);'))
  assert(calloutRule.includes('padding: 0;'))
  assert(calloutRule.includes('border-left: 0;'))

  assert(calloutIconRule, 'callout icon rule should be present')
  assert(calloutIconRule[1].includes('display: inline-grid;'))
  assert(calloutIconRule[1].includes('color: var(--nano-muted);'))
  assert.equal(calloutIconRule[1].includes('background'), false)
})

test('Document surface keeps controls as quiet indicators', () => {
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const inlineCss = readFileSync(new URL('../../src/styles/inline-tokens.css', import.meta.url), 'utf8')
  const todoIconRule = /\.nano-todo-icon \{([\s\S]*?)\n\}/.exec(inlineCss)
  const foldHoverRule = /\.nano-heading-collapsible:hover \.nano-heading-fold,[\s\S]*?\.nano-list-collapsed \.nano-list-fold \{([\s\S]*?)\n\}/.exec(editorCss)
  const todoBoxRule = /\.nano-todo-box \{([\s\S]*?)\n\}/.exec(editorCss)

  assert(todoIconRule, 'todo icon rule should be present')
  assert(todoIconRule[1].includes('width: 13px;'))
  assert(todoIconRule[1].includes('height: 13px;'))
  assert(todoIconRule[1].includes('stroke-width: 1.65;'))

  assert(todoBoxRule, 'todo box rule should be present')
  assert(todoBoxRule[1].includes('opacity: 0.72;'))
  assert.equal(todoBoxRule[1].includes('#57606a'), false)

  assert(foldHoverRule, 'fold hover rule should be present')
  assert(foldHoverRule[1].includes('opacity: 0.26;'))
  assert.equal(foldHoverRule[1].includes('opacity: 0.45;'), false)
})

test('Document surface keeps reference blocks inline', () => {
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const referenceRule = /\.nano-bookmark-link,[\s\S]*?\.nano-tag-ref-card \{([\s\S]*?)\n\}/.exec(editorCss)
  const attachmentIconRule = /\.nano-attachment-icon \{([\s\S]*?)\n\}/.exec(editorCss)

  assert(referenceRule, 'reference link rule should be present')
  assert(referenceRule[1].includes('display: inline;'))
  assert.equal(referenceRule[1].includes('display: grid;'), false)
  assert(editorCss.includes('.nano-attachment-link,'))
  assert(editorCss.includes('.nano-tag-ref-card {'))
  assert.equal(editorCss.includes('.nano-attachment-link {\n  display: inline;'), false)
  assert.equal((editorCss.match(/\.nano-tag-ref-card \{/g) ?? []).length, 1)
  assert.equal(editorCss.includes("::before {\n  content: ' ';"), false)

  assert(attachmentIconRule, 'attachment icon rule should be present')
  assert(attachmentIconRule[1].includes('display: none;'))
})

test('Document surface keeps code content unframed', () => {
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const inlineCodeRule = /\.nano-document code \{([\s\S]*?)\n\}/.exec(baseCss)
  const blockCodeRule = /\.nano-document pre \{([\s\S]*?)\n\}/.exec(baseCss)

  assert(inlineCodeRule, 'inline code rule should be present')
  assert(inlineCodeRule[1].includes('background: transparent;'))
  assert(inlineCodeRule[1].includes('padding: 0;'))
  assert.equal(inlineCodeRule[1].includes('border-radius'), false)
  assert.equal(inlineCodeRule[1].includes('var(--nano-soft)'), false)

  assert(blockCodeRule, 'block code rule should be present')
  assert(blockCodeRule[1].includes('background: transparent;'))
  assert(blockCodeRule[1].includes('padding: 0;'))
  assert.equal(blockCodeRule[1].includes('border-radius'), false)
  assert.equal(blockCodeRule[1].includes('var(--nano-soft)'), false)
  assert.equal(baseCss.includes('--nano-soft'), false)
})
