import { editorPartCatalog } from '../assembly/part-catalog'
import type { NanoBlock, NanoDocument, NanoMark } from '../core/nano-core'

type MarkSeed<TMark extends NanoMark = NanoMark> = TMark extends NanoMark
  ? Omit<TMark, 'from' | 'to'>
  : never

type TextSegment = string | {
  text: string
  marks: readonly MarkSeed[]
}

const sampleImageSvg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">',
  '<rect width="640" height="360" fill="#edf2f7"/>',
  '<rect x="44" y="44" width="552" height="272" rx="18" fill="#ffffff"/>',
  '<path d="M92 236h456" stroke="#c7d2df" stroke-width="3"/>',
  '<rect x="92" y="92" width="190" height="24" rx="8" fill="#2563eb"/>',
  '<rect x="92" y="136" width="380" height="16" rx="6" fill="#94a3b8"/>',
  '<rect x="92" y="172" width="304" height="16" rx="6" fill="#cbd5e1"/>',
  '<rect x="92" y="260" width="96" height="18" rx="6" fill="#0f766e"/>',
  '<rect x="210" y="260" width="138" height="18" rx="6" fill="#d97706"/>',
  '</svg>',
].join('')

const sampleImageSrc = `data:image/svg+xml,${encodeURIComponent(sampleImageSvg)}`

export const partCatalogDocument: NanoDocument = {
  blocks: [
    heading('catalog-title', 1, 'Content Catalog'),
    paragraph(
      'catalog-intro',
      `Nano Edit이 현재 조립 가능한 engine part ${editorPartCatalog.length}개를 실제 문서 콘텐츠로 확인하는 카탈로그다. 각 항목은 글자 목록이 아니라 렌더링된 block, inline mark, reference surface다.`,
    ),
    heading('inline-title', 2, 'Inline text'),
    markedParagraph('inline-samples', [
      { text: 'Quick edit', marks: [{ type: 'bold' }] },
      ' keeps generated output readable while ',
      { text: 'small changes', marks: [{ type: 'italic' }] },
      ' patch ',
      { text: 'local facts', marks: [{ type: 'underline' }] },
      ', ',
      { text: 'old wording', marks: [{ type: 'strike' }] },
      ', ',
      { text: 'approved terms', marks: [{ type: 'highlight' }] },
      ', ',
      { text: 'createNanoView()', marks: [{ type: 'code' }] },
      ', ',
      {
        text: 'reference links',
        marks: [{ type: 'link', href: 'https://example.com/nano-edit', title: 'Nano Edit reference' }],
      },
      ', ',
      { text: '#content-catalog', marks: [{ type: 'tag', name: 'content-catalog' }] },
      ', ',
      { text: 'Roadmap', marks: [{ type: 'note_link', target: 'Roadmap', alias: 'Roadmap' }] },
      ', ',
      { text: 'E=mc^2', marks: [{ type: 'math', formula: 'E=mc^2' }] },
      ', and ',
      { text: '[^surface]', marks: [{ type: 'footnote_ref', name: 'surface' }] },
      '.',
    ]),
    heading('blocks-title', 2, 'Blocks'),
    paragraph(
      'paragraph-sample',
      'Paragraph block: generated technical prose remains the primary surface, with only the selected phrase becoming editable.',
    ),
    {
      id: 'todo-done',
      type: 'todo',
      checked: true,
      indent: 0,
      text: 'Confirm the generated title',
      marks: [],
    },
    {
      id: 'todo-open',
      type: 'todo',
      checked: false,
      indent: 0,
      text: 'Patch one claim after review',
      marks: [],
    },
    {
      id: 'list-bullet',
      type: 'list_item',
      kind: 'bullet',
      indent: 0,
      marker: '-',
      text: 'Bullet item for generated notes',
      marks: [],
    },
    {
      id: 'list-ordered',
      type: 'list_item',
      kind: 'ordered',
      indent: 0,
      start: 1,
      orderedMarker: '.',
      text: 'Ordered step for review flow',
      marks: [],
    },
    {
      id: 'quote-sample',
      type: 'quote',
      text: 'A quoted requirement can stay visually distinct without becoming a separate editor mode.',
      marks: [],
    },
    {
      id: 'callout-sample',
      type: 'callout',
      tone: 'tip',
      text: 'Use slash on an empty block to insert another content part.',
      marks: [],
    },
    {
      id: 'code-sample',
      type: 'code',
      language: 'ts',
      text: [
        'const document = nanoDocumentFromMarkdown(markdown)',
        'createNanoView({ mount, engine: createNanoDocument(document) })',
      ].join('\n'),
    },
    {
      id: 'math-sample',
      type: 'math',
      text: 'quiet_edit_ratio = local_edits / generated_blocks',
    },
    {
      id: 'table-sample',
      type: 'table',
      rows: [
        ['Content part', 'Rendered as', 'Quiet edit target'],
        ['block.table', 'comparison matrix', 'single cell'],
        ['mark.link', 'inline reference', 'label or href'],
        ['block.todo', 'checklist row', 'checked state'],
      ],
      align: ['left', 'left', 'left'],
    },
    {
      id: 'divider-sample',
      type: 'divider',
      marker: '---',
      markerLength: 3,
    },
    {
      id: 'image-sample',
      type: 'image',
      src: sampleImageSrc,
      alt: 'Content catalog card',
      title: 'Rendered image block',
    },
    heading('references-title', 2, 'References'),
    {
      id: 'bookmark-sample',
      type: 'bookmark',
      href: 'https://example.com/nano-edit/content-catalog',
      label: 'Content catalog reference',
      title: 'Standalone bookmark block',
    },
    {
      id: 'attachment-sample',
      type: 'attachment',
      src: '/docs/catalog-export.md',
      label: 'catalog-export.md',
      title: 'Generated Markdown export',
    },
    {
      id: 'note-ref-sample',
      type: 'note_ref',
      target: 'Roadmap',
      alias: 'Roadmap',
    },
    {
      id: 'tag-ref-sample',
      type: 'tag_ref',
      name: 'generated-markdown',
    },
    {
      id: 'footnote-surface',
      type: 'footnote',
      name: 'surface',
      text: 'The catalog is still a normal Nano Document, so every sample can be selected, inspected, and edited in place.',
      marks: [],
    },
    heading('runtime-title', 2, 'Runtime surfaces'),
    {
      id: 'runtime-table',
      type: 'table',
      rows: [
        ['Surface', 'Shown in demo', 'Purpose'],
        ['Command palette', 'slash or keyboard command', 'insert the selected part'],
        ['Inspector', 'active block metadata', 'check source and structure'],
        ['Slide rail', 'deck document', 'review generated presentation flow'],
      ],
      align: ['left', 'left', 'left'],
    },
  ],
}

function heading(id: string, level: 1 | 2 | 3 | 4 | 5 | 6, text: string): NanoBlock {
  return { id, type: 'heading', level, text, marks: [] }
}

function paragraph(id: string, text: string): NanoBlock {
  return { id, type: 'paragraph', text, marks: [] }
}

function markedParagraph(id: string, segments: readonly TextSegment[]): NanoBlock {
  let text = ''
  const marks: NanoMark[] = []

  for (const segment of segments) {
    const value = typeof segment === 'string' ? segment : segment.text
    const from = text.length
    text += value
    const to = text.length

    if (typeof segment === 'string') continue

    for (const mark of segment.marks) {
      marks.push({ ...mark, from, to } as NanoMark)
    }
  }

  return { id, type: 'paragraph', text, marks }
}
