import {
  NanoDeckSchema,
  createEmptyNanoDeck,
  createNanoDeck,
  nanoDeckFromMarkdown,
  nanoMarkdownFromDeck,
} from '../../src/index.ts'
import { assert, test } from './harness.mjs'

test('Nano Deck model wraps slide regions around reusable Nano blocks', () => {
  const deck = createEmptyNanoDeck()

  assert.equal(deck.id, 'deck-1')
  assert.equal(deck.slides[0].layout, 'default')
  assert.equal(deck.slides[0].regions[0].kind, 'title')
  assert.equal(deck.slides[0].regions[0].blocks[0].type, 'heading')

  const engine = createNanoDeck(deck)
  assert.deepEqual(engine.value, deck)
})

test('Nano Deck schema rejects duplicate ids and invalid nested blocks', () => {
  assert.throws(() => NanoDeckSchema.parse({
    id: 'deck',
    slides: [
      {
        id: 'same-slide',
        layout: 'default',
        regions: [{
          id: 'slide-1-body',
          kind: 'body',
          blocks: [{ id: 'same-block', type: 'paragraph', text: 'ok', marks: [] }],
        }],
      },
      {
        id: 'same-slide',
        layout: 'default',
        regions: [{
          id: 'slide-2-body',
          kind: 'body',
          blocks: [{ id: 'same-block', type: 'paragraph', text: 'ok', marks: [] }],
        }],
      },
    ],
  }), /Duplicate slide id/)

  assert.throws(() => NanoDeckSchema.parse({
    id: 'deck',
    slides: [{
      id: 'slide-1',
      layout: 'default',
      regions: [{
        id: 'slide-1-body',
        kind: 'body',
        blocks: [{ id: 'bad-mark', type: 'paragraph', text: 'Short', marks: [{ type: 'bold', from: 0, to: 8 }] }],
      }],
    }],
  }), /Mark range exceeds block text length/)

  assert.throws(() => NanoDeckSchema.parse({
    id: 'deck',
    slides: [{
      id: 'slide-1',
      layout: 'default',
      regions: [{
        id: 'slide-1-notes',
        kind: 'notes',
        blocks: [{ id: 'speaker-note', type: 'paragraph', text: 'Only notes', marks: [] }],
      }],
    }],
  }), /visible region/)
})

test('Markdown slide syntax imports to Nano Deck title body and notes regions', () => {
  const markdown = [
    '---',
    'title: Generated Pitch',
    'theme: simple',
    '---',
    '',
    '# Problem',
    '',
    '- Users get generated decks',
    '- Last-mile edits are painful',
    '',
    '::: notes',
    'Mention the review loop.',
    ':::',
    '',
    '---',
    '',
    '# Solution',
    '',
    '| Surface | Edit |',
    '| --- | --- |',
    '| Slide | Quiet local edit |',
  ].join('\n')

  const deck = nanoDeckFromMarkdown(markdown)

  assert.equal(deck.title, 'Generated Pitch')
  assert.equal(deck.metadata.theme, 'simple')
  assert.equal(deck.slides.length, 2)
  assert.deepEqual(deck.slides[0].regions.map((region) => region.kind), ['title', 'body', 'notes'])
  assert.equal(deck.slides[0].regions[0].blocks[0].type, 'heading')
  assert.equal(deck.slides[0].regions[0].blocks[0].text, 'Problem')
  assert.equal(deck.slides[0].regions[1].blocks[0].type, 'list_item')
  assert.equal(deck.slides[0].regions[2].blocks[0].text, 'Mention the review loop.')
  assert.equal(deck.slides[1].regions[1].blocks[0].type, 'table')
})

test('Nano Deck serializes back to LLM-friendly Markdown slide syntax', () => {
  const deck = nanoDeckFromMarkdown([
    '# One',
    '',
    'Body copy',
    '',
    'Notes:',
    'Private note',
    '',
    '---',
    '',
    '# Two',
    '',
    '- Point',
  ].join('\n'))

  assert.equal(nanoMarkdownFromDeck(deck), [
    '# One',
    '',
    'Body copy',
    '',
    '::: notes',
    'Private note',
    ':::',
    '',
    '---',
    '',
    '# Two',
    '',
    '- Point',
  ].join('\n'))
})
