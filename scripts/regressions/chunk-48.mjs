import { footnoteNodeSpec } from '../../src/prosemirror-footnote-node-spec.ts'
import { assert, test } from './harness.mjs'

test('ProseMirror footnote DOM parsing falls back when data-name is blank', () => {
  assert.deepEqual(parseAttrs(footnoteNodeSpec, element({ dataset: { name: '  source  ' } })), {
    footnoteContinuationIndents: null,
    footnoteTextSpacing: null,
    name: 'source',
  })
  assert.deepEqual(parseAttrs(footnoteNodeSpec, element({
    dataset: { name: '   ' },
    query: { '.nano-footnote-marker': element({ dataset: { label: 'label-name' } }) },
  })), {
    footnoteContinuationIndents: null,
    footnoteTextSpacing: null,
    name: 'label-name',
  })
  assert.deepEqual(parseAttrs(footnoteNodeSpec, element({
    dataset: { name: '   ' },
    query: { '.nano-footnote-marker': element({ textContent: '[^text-name]' }) },
  })), {
    footnoteContinuationIndents: null,
    footnoteTextSpacing: null,
    name: 'text-name',
  })
  assert.deepEqual(parseAttrs(footnoteNodeSpec, element({ dataset: { name: '   ' } })), {
    footnoteContinuationIndents: null,
    footnoteTextSpacing: null,
    name: '1',
  })
})

function parseAttrs(spec, dom) {
  return spec.parseDOM[0].getAttrs(dom)
}

function element({ dataset = {}, textContent = '', query = {} } = {}) {
  return {
    dataset,
    textContent,
    querySelector: (selector) => query[selector] ?? null,
  }
}
