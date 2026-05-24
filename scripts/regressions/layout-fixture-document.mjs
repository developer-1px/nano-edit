const longHref = [
  'https://example.com/reports/field-note',
  'very-long-destination-with-source-token-overflow',
  'rain-market-forecast',
  'camera-contact-sheet',
  'release-candidate-check',
].join('/')

const inlineText = [
  'Short link bold italic highlight strike code tag note foot.',
].join(' ')

export const layoutFixtureDocument = {
  blocks: [
    {
      id: 'layout-title',
      type: 'heading',
      level: 1,
      text: 'Layout Contract',
      marks: [],
    },
    {
      id: 'layout-link',
      type: 'paragraph',
      text: inlineText,
      marks: [
        mark(inlineText, 'Short link', 'link', { href: longHref }),
        mark(inlineText, 'bold', 'bold'),
        mark(inlineText, 'italic', 'italic'),
        mark(inlineText, 'highlight', 'highlight'),
        mark(inlineText, 'strike', 'strike'),
        mark(inlineText, 'code', 'code'),
        mark(inlineText, 'tag', 'tag', { name: 'layout-check' }),
        mark(inlineText, 'note', 'note_link', { target: 'Layout Contract', alias: 'note' }),
        mark(inlineText, 'foot', 'footnote_ref', { name: 'layout' }),
      ],
    },
    {
      id: 'layout-todo',
      type: 'todo',
      checked: false,
      text: 'Verify source marker stays off-flow',
      marks: [],
    },
    {
      id: 'layout-ordered',
      type: 'list_item',
      kind: 'ordered',
      text: 'Ordered marker keeps a fixed track',
      marks: [],
    },
    {
      id: 'layout-bullet',
      type: 'list_item',
      kind: 'bullet',
      text: 'Bullet marker keeps a fixed track',
      marks: [],
    },
    {
      id: 'layout-code',
      type: 'code',
      language: 'js',
      text: [
        'const sourceReveal = "off-flow";',
        'const blockRect = measure(parentBlock);',
        'assert(blockRect.height < 80);',
      ].join('\n'),
    },
    {
      id: 'layout-table',
      type: 'table',
      rows: [
        ['Item', 'State', 'Next'],
        ['link', 'stable', 'measure'],
        ['source', 'visible', 'overlay'],
        ['mobile', 'narrow', 'no overflow'],
      ],
    },
    {
      id: 'layout-image',
      type: 'image',
      alt: 'small inline fixture',
      src: [
        'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22320%22%20height%3D%22180%22%20viewBox%3D%220%200%20320%20180%22%3E',
        '%3Crect%20width%3D%22320%22%20height%3D%22180%22%20fill%3D%22%23f6f8fa%22%2F%3E',
        '%3Cpath%20d%3D%22M40%20128L116%2074L168%20110L224%2054L280%20128Z%22%20fill%3D%22%23d0d7de%22%2F%3E',
        '%3C%2Fsvg%3E',
      ].join(''),
    },
    {
      id: 'layout-footnote',
      type: 'footnote',
      name: 'layout',
      text: 'Source tokens must not resize the document flow.',
      marks: [],
    },
  ],
}

function mark(text, needle, type, attrs = {}) {
  const from = text.indexOf(needle)
  if (from < 0) throw new Error(`Missing fixture text: ${needle}`)
  return { type, from, to: from + needle.length, ...attrs }
}
