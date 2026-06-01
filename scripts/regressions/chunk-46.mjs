import {
  markdownTextFromClipboardData,
  writeMarkdownTextToClipboardData,
} from '../../src/view/clipboard/data.ts'
import { assert, test } from './harness.mjs'

function clipboardData(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getData: (type) => values.get(type) ?? '',
    setData: (type, value) => values.set(type, value),
    values,
  }
}

test('Markdown clipboard data prefers text/markdown and writes plain fallback', () => {
  const markdownClipboard = clipboardData({
    'text/markdown': '# Title',
    'text/plain': 'Title',
  })
  assert.equal(markdownTextFromClipboardData(markdownClipboard), '# Title')

  const plainClipboard = clipboardData({
    'text/plain': 'Plain note',
  })
  assert.equal(markdownTextFromClipboardData(plainClipboard), 'Plain note')

  const targetClipboard = clipboardData()
  writeMarkdownTextToClipboardData(targetClipboard, '- [x] Done')
  assert.equal(targetClipboard.values.get('text/plain'), '- [x] Done')
  assert.equal(targetClipboard.values.get('text/markdown'), '- [x] Done')
})
