import { readFileSync } from 'node:fs'
import { assert, blockDomSpec, test } from './harness.mjs'

test('Hidden gutter picker chrome stays removed', () => {
  const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8')
  const blockUi = readFileSync(new URL('../../src/nano-block-ui-decorations.ts', import.meta.url), 'utf8')
  const gutterRuntime = readFileSync(new URL('../../src/nano-view-gutter-runtime.ts', import.meta.url), 'utf8')
  const inspectorShell = readFileSync(new URL('../../src/nano-inspector-shell.ts', import.meta.url), 'utf8')
  assert.equal(css.includes('block-picker-option'), false)
  assert.equal(css.includes('content: attr(data-md);'), false)
  assert.equal(css.includes('nano-block-insert'), false)
  assert.equal(blockUi.includes('Decoration.widget'), false)
  assert.equal(gutterRuntime.includes('createNanoGutterPickerRuntime'), false)
  assert.equal(css.includes('content: "/" attr(data-query);'), false)
  assert.equal(inspectorShell.includes('@todo #tag [[note]]'), false)
  assert(inspectorShell.includes("placeholder = 'Search'"))
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
  assert(baseCss.includes('.ProseMirror-selectednode'))
  assert.equal(baseCss.includes('#8cf'), false)
  assert.equal(baseCss.includes('markdown-body'), false)
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

test('Document surface keeps reference blocks inline', () => {
  const editorCss = readFileSync(new URL('../../src/styles/editor-blocks.css', import.meta.url), 'utf8')
  const referenceRule = /\.nano-bookmark-link,[\s\S]*?\.nano-tag-ref-card \{([\s\S]*?)\n\}/.exec(editorCss)
  const attachmentRule = /\.nano-attachment-link \{([\s\S]*?)\n\}/.exec(editorCss)
  const attachmentIconRule = /\.nano-attachment-icon \{([\s\S]*?)\n\}/.exec(editorCss)
  const tagRefRule = /\.nano-tag-ref-card \{([\s\S]*?)\n\}/.exec(editorCss)

  assert(referenceRule, 'reference link rule should be present')
  assert(referenceRule[1].includes('display: inline;'))
  assert.equal(referenceRule[1].includes('display: grid;'), false)

  assert(attachmentRule, 'attachment link rule should be present')
  assert(attachmentRule[1].includes('display: inline;'))
  assert.equal(attachmentRule[1].includes('grid-template-columns'), false)

  assert(attachmentIconRule, 'attachment icon rule should be present')
  assert(attachmentIconRule[1].includes('display: none;'))

  assert(tagRefRule, 'tag reference rule should be present')
  assert(tagRefRule[1].includes('display: inline;'))
  assert.equal(tagRefRule[1].includes('inline-grid'), false)
})

test('Document surface keeps code content unframed', () => {
  const baseCss = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8')
  const inlineCodeRule = /\.nano-document code \{([\s\S]*?)\n\}/.exec(baseCss)
  const blockCodeRule = /\.nano-document pre \{([\s\S]*?)\n\}/.exec(baseCss)

  assert(inlineCodeRule, 'inline code rule should be present')
  assert(inlineCodeRule[1].includes('background: transparent;'))
  assert(inlineCodeRule[1].includes('border-radius: 0;'))
  assert(inlineCodeRule[1].includes('padding: 0;'))
  assert.equal(inlineCodeRule[1].includes('var(--nano-soft)'), false)

  assert(blockCodeRule, 'block code rule should be present')
  assert(blockCodeRule[1].includes('background: transparent;'))
  assert(blockCodeRule[1].includes('border-radius: 0;'))
  assert(blockCodeRule[1].includes('padding: 0;'))
  assert.equal(blockCodeRule[1].includes('var(--nano-soft)'), false)
})
