import { createNanoEditorAttributes } from '../../src/view/runtime/editor-attributes.ts'
import { assert, test } from './harness.mjs'

test('Nano view editor attributes stay quiet but host-configurable', () => {
  const defaults = createNanoEditorAttributes({})
  assert.equal(defaults.class, 'nano-document')
  assert.equal(defaults.role, 'textbox')
  assert.equal(defaults['aria-label'], 'Document')
  assert.equal(defaults['aria-multiline'], 'true')
  assert.equal(defaults.spellcheck, 'false')

  const configured = createNanoEditorAttributes({
    ariaLabel: '  현장 기록  ',
    spellcheck: true,
  })
  assert.equal(configured['aria-label'], '현장 기록')
  assert.equal(configured.spellcheck, 'true')

  const blankLabel = createNanoEditorAttributes({
    ariaLabel: '   ',
  })
  assert.equal(blankLabel['aria-label'], 'Document')
})
