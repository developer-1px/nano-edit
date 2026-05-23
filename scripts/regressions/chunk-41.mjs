import { assert, deleteBlockSyntaxTransaction, markdownAfter, test, textSelectionState } from './harness.mjs'

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
