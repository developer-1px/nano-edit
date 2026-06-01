import { readFileSync } from 'node:fs'
import {
  assert,
  blockPositionById,
  EditorState,
  nanoSchema,
  prosemirrorDocFromNano,
  test,
  TextSelection,
} from './harness.mjs'
import { sourceRevealDecorations } from '../../src/features/viewer-edit/source-reveal/plugin.ts'

test('Inline Markdown syntax reveal is focus and selection scoped', () => {
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const inlineCss = readFileSync(new URL('../../src/styles/inline-tokens.css', import.meta.url), 'utf8')
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const sourceReveal = readFileSync(new URL('../../src/features/viewer-edit/source-reveal/plugin.ts', import.meta.url), 'utf8')
  const sourceRevealWidgets = readFileSync(new URL('../../src/features/viewer-edit/source-reveal/widgets.ts', import.meta.url), 'utf8')
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
  assert(sourceRevealWidgets.includes('Decoration.widget'))
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
  const dispatcher = readFileSync(new URL('../../src/view/engine/dispatch.ts', import.meta.url), 'utf8')
  assert(dispatcher.includes('sourceRevealPluginKey'))
  assert(dispatcher.includes('transaction.getMeta(sourceRevealPluginKey)'))
  assert(dispatcher.indexOf('transaction.getMeta(sourceRevealPluginKey)') < dispatcher.indexOf('restoreNanoSelection(ctx, selection)'))
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
