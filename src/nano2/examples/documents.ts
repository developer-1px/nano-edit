import type { NanoDocument } from '../../entities/document/nano-document-model'
import { NanoDocumentSchema } from '../../entities/document/nano-document-model'
import { nanoDocumentFromMarkdown } from '../../codecs/markdown/nano-markdown-parse'

const basicsMarkdown = `# Basics

Nano2 keeps this document as json-document state. DOM input, selection, clipboard, and composition pass through the copied ProseMirror view seed.

Edit this paragraph. Split it with Enter. Toggle bold with Cmd/Ctrl+B. Change it to a level-two heading with Ctrl+Shift+2.

## Checks

- Text edits commit as NanoDocument changes
- Undo and redo use json-document history
- Reloading this example restores the same NanoDocument`

export const nano2BasicsDocument: NanoDocument = nanoDocumentFromMarkdown(basicsMarkdown)

export const nano2DinosDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-dinos-title',
      type: 'heading',
      level: 1,
      text: 'Dinos in the document',
      marks: [],
    },
    {
      id: 'nano2-dinos-body',
      type: 'paragraph',
      text: '\ufffc is an inline atom backed by a one-character Nano mark. Type @ to insert another chip.',
      marks: [
        {
          type: 'mention',
          from: 0,
          to: 1,
          id: 'mina',
          label: 'Mina',
        },
      ],
    },
    {
      id: 'nano2-dinos-checks',
      type: 'paragraph',
      text: 'Copy, paste, delete, and move across the chip. The DOM renders a contenteditable=false atom; json-document stores stable attrs.',
      marks: [],
    },
  ],
})

export const nano2TiptapStarterKitDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-tiptap-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap StarterKit',
      marks: [],
    },
    {
      id: 'nano2-tiptap-inline',
      type: 'paragraph',
      text: 'Inline target',
      marks: [],
    },
    {
      id: 'nano2-tiptap-bullet',
      type: 'paragraph',
      text: 'Bullet target',
      marks: [],
    },
    {
      id: 'nano2-tiptap-ordered',
      type: 'paragraph',
      text: 'Ordered target',
      marks: [],
    },
    {
      id: 'nano2-tiptap-quote',
      type: 'paragraph',
      text: 'Quote target',
      marks: [],
    },
    {
      id: 'nano2-tiptap-code',
      type: 'paragraph',
      text: 'Code block target',
      marks: [],
    },
    {
      id: 'nano2-tiptap-existing',
      type: 'paragraph',
      text: 'Existing marks: bold italic underline strike code link',
      marks: [
        { type: 'bold', from: 16, to: 20 },
        { type: 'italic', from: 21, to: 27 },
        { type: 'underline', from: 28, to: 37 },
        { type: 'strike', from: 38, to: 44 },
        { type: 'code', from: 45, to: 49 },
        { type: 'link', from: 50, to: 54, href: 'https://tiptap.dev' },
      ],
    },
    {
      id: 'nano2-tiptap-divider',
      type: 'divider',
    },
  ],
})

export const nano2TiptapDefaultEditorDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-default-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Default Editor',
      marks: [],
    },
    {
      id: 'nano2-default-inline-target',
      type: 'paragraph',
      text: 'Inline default target',
      marks: [],
    },
    {
      id: 'nano2-default-heading-target',
      type: 'paragraph',
      text: 'Heading default target',
      marks: [],
    },
    {
      id: 'nano2-default-list-target',
      type: 'paragraph',
      text: 'List default target',
      marks: [],
    },
    {
      id: 'nano2-default-quote-target',
      type: 'paragraph',
      text: 'Quote default target',
      marks: [],
    },
  ],
})

export const nano2TiptapFormattingDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-formatting-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Formatting',
      marks: [],
    },
    {
      id: 'nano2-formatting-mark-target',
      type: 'paragraph',
      text: 'Format target',
      marks: [],
    },
    {
      id: 'nano2-formatting-heading-target',
      type: 'paragraph',
      text: 'Heading target',
      marks: [],
    },
    {
      id: 'nano2-formatting-existing',
      type: 'paragraph',
      text: 'Existing: bold italic underline strike code',
      marks: [
        { type: 'bold', from: 10, to: 14 },
        { type: 'italic', from: 15, to: 21 },
        { type: 'underline', from: 22, to: 31 },
        { type: 'strike', from: 32, to: 38 },
        { type: 'code', from: 39, to: 43 },
      ],
    },
  ],
})

export const nano2TiptapTextDirectionDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-direction-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Text Direction',
      marks: [],
    },
    {
      id: 'nano2-direction-rtl',
      type: 'paragraph',
      text: 'مرحبا Nano2',
      marks: [],
      textDirection: 'rtl',
    },
    {
      id: 'nano2-direction-ltr-target',
      type: 'paragraph',
      text: 'LTR target',
      marks: [],
      textDirection: 'rtl',
    },
    {
      id: 'nano2-direction-auto-target',
      type: 'paragraph',
      text: 'Auto target',
      marks: [],
    },
    {
      id: 'nano2-direction-list',
      type: 'list_item',
      kind: 'bullet',
      indent: 0,
      text: 'שלום list',
      marks: [],
      textDirection: 'rtl',
    },
  ],
})

export const nano2TiptapImagesDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-images-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Images',
      marks: [],
    },
    {
      id: 'nano2-image-existing',
      type: 'image',
      src: '/favicon.svg',
      alt: 'Nano Edit icon',
      title: 'Existing image',
    },
    {
      id: 'nano2-image-markdown-target',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-image-html-target',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2LongTextsParagraphCount = 260
export const nano2LongTextsWordsPerBlock = 800
export const nano2LongTextsWordCount = nano2LongTextsParagraphCount * nano2LongTextsWordsPerBlock

export const nano2TiptapLongTextsDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: Array.from({ length: nano2LongTextsParagraphCount + 1 }, (_, index) => ({
    id: `nano2-long-${String(index).padStart(3, '0')}`,
    type: index === 0 ? 'heading' : 'paragraph',
    ...(index === 0 ? { level: 1 } : {}),
    text: index === 0 ? 'Tiptap Long Texts' : longTextBlock(index),
    marks: [],
  })),
})

function longTextBlock(index: number): string {
  const blockNumber = String(index).padStart(3, '0')
  return Array.from(
    { length: nano2LongTextsWordsPerBlock },
    (_, wordIndex) => `nano2-${blockNumber}-${String(wordIndex + 1).padStart(3, '0')}`,
  ).join(' ')
}

export const nano2LongTextsTargetBlockId = 'nano2-long-120'

export const nano2TiptapMinimalSetupDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-minimal-title',
      type: 'paragraph',
      text: 'Minimal setup',
      marks: [],
    },
    {
      id: 'nano2-minimal-target',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2TiptapTablesDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-tables-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Tables',
      marks: [],
    },
    {
      id: 'nano2-table-main',
      type: 'table',
      rows: [
        ['Name', 'Status'],
        ['Alpha', 'Open'],
        ['Beta', 'Queued'],
      ],
      align: ['left', 'center'],
    },
  ],
})

export const nano2TiptapMarkdownShortcutsDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-shortcuts-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Markdown Shortcuts',
      marks: [],
    },
    {
      id: 'nano2-shortcut-heading',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-shortcut-bullet',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-shortcut-ordered',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-shortcut-quote',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-shortcut-code',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-shortcut-divider',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-shortcut-inline',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2TiptapTasksDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-tasks-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Tasks',
      marks: [],
    },
    {
      id: 'nano2-task-unchecked',
      type: 'todo',
      checked: false,
      text: 'Ship unchecked task',
      marks: [],
    },
    {
      id: 'nano2-task-checked',
      type: 'todo',
      checked: true,
      text: 'Review checked task',
      marks: [],
    },
    {
      id: 'nano2-task-shortcut-open',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-task-shortcut-done',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2TiptapMentionsDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-mentions-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Mentions',
      marks: [],
    },
    {
      id: 'nano2-mentions-existing',
      type: 'paragraph',
      text: 'Review \ufffc before shipping',
      marks: [
        { type: 'mention', from: 7, to: 8, id: 'mina', label: 'Mina' },
      ],
    },
    {
      id: 'nano2-mentions-target',
      type: 'paragraph',
      text: 'Mention target',
      marks: [],
    },
  ],
})

export const nano2TiptapMenusDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-menus-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Menus',
      marks: [],
    },
    {
      id: 'nano2-menus-selection',
      type: 'paragraph',
      text: 'Select menu target',
      marks: [],
    },
    {
      id: 'nano2-menus-floating',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2TiptapCleverEditorDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-clever-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Clever Editor',
      marks: [],
    },
    {
      id: 'nano2-clever-emoji',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-clever-typography',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-clever-highlight',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2TiptapForcedContentStructureDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-forced-title',
      type: 'heading',
      level: 1,
      text: 'Forced content structure',
      marks: [],
    },
    {
      id: 'nano2-forced-summary',
      type: 'paragraph',
      text: 'This document must keep exactly one title slot before body content.',
      marks: [],
    },
    {
      id: 'nano2-forced-body',
      type: 'paragraph',
      text: 'Body target',
      marks: [],
    },
  ],
})

export const nano2TiptapSlashCommandsDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-slash-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Slash Commands',
      marks: [],
    },
    {
      id: 'nano2-slash-heading',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-slash-bullet',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-slash-quote',
      type: 'paragraph',
      text: '',
      marks: [],
    },
    {
      id: 'nano2-slash-code',
      type: 'paragraph',
      text: '',
      marks: [],
    },
  ],
})

export const nano2TiptapSyntaxHighlightingDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-syntax-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Syntax Highlighting',
      marks: [],
    },
    {
      id: 'nano2-syntax-code',
      type: 'code',
      language: 'typescript',
      text: [
        'const answer: number = 42',
        'function run() {',
        '  return `value:${answer}`',
        '}',
      ].join('\n'),
    },
    {
      id: 'nano2-syntax-plain',
      type: 'code',
      text: 'plain text stays editable',
    },
  ],
})

export const nano2TiptapCollaborationDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-collab-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Collaboration',
      marks: [],
    },
    {
      id: 'nano2-collab-shared',
      type: 'paragraph',
      text: 'Shared paragraph',
      marks: [],
    },
    {
      id: 'nano2-collab-second',
      type: 'paragraph',
      text: 'Second peer paragraph',
      marks: [],
    },
  ],
})

export const nano2TiptapDrawingDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-drawing-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Drawing',
      marks: [],
    },
    {
      id: 'nano2-drawing-canvas',
      type: 'nano2.drawing',
      text: '1 drawing stroke',
      data: {
        width: 480,
        height: 180,
        strokes: [{
          color: '#315f9c',
          width: 4,
          points: [
            [34, 108],
            [136, 52],
            [272, 124],
            [426, 66],
          ],
        }],
      },
    },
    {
      id: 'nano2-drawing-note',
      type: 'paragraph',
      text: 'Canvas state is custom block JSON.',
      marks: [],
    },
  ],
})

export const nano2TiptapIFrameDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-iframe-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap iFrame',
      marks: [],
    },
    {
      id: 'nano2-iframe-embed',
      type: 'nano2.iframe',
      text: 'Nano2 iframe embed',
      data: {
        allow: 'fullscreen',
        height: 315,
        sandbox: 'allow-same-origin allow-scripts allow-presentation',
        src: 'https://example.com/nano2-iframe',
        title: 'Nano2 iframe',
        width: 560,
      },
    },
    {
      id: 'nano2-iframe-note',
      type: 'paragraph',
      text: 'Embed attrs are custom block JSON.',
      marks: [],
    },
  ],
})

export const nano2TiptapFigureDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-figure-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Figure',
      marks: [],
    },
    {
      id: 'nano2-figure-image',
      type: 'nano2.figure',
      text: 'Image figure caption',
      data: {
        kind: 'image',
        caption: 'Image figure caption',
        image: {
          src: '/favicon.svg',
          alt: 'Nano Edit icon',
          title: 'Nano Edit icon',
        },
      },
    },
    {
      id: 'nano2-figure-table',
      type: 'nano2.figure',
      text: 'Table figure caption',
      data: {
        kind: 'table',
        caption: 'Table figure caption',
        table: {
          rows: [
            ['Feature', 'State'],
            ['Image figure', 'ready'],
            ['Table figure', 'ready'],
          ],
          align: ['left', 'center'],
        },
      },
    },
    {
      id: 'nano2-figure-note',
      type: 'paragraph',
      text: 'Figure content and captions are custom block JSON.',
      marks: [],
    },
  ],
})

export const nano2TiptapInteractiveViewsDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-interactive-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Interactive Views',
      marks: [],
    },
    {
      id: 'nano2-interactive-counter',
      type: 'nano2.interactive-view',
      text: 'Interactive node view: 2',
      data: {
        count: 2,
        label: 'Interactive node view',
        tone: 'accent',
      },
    },
    {
      id: 'nano2-interactive-note',
      type: 'paragraph',
      text: 'Component state is custom block JSON.',
      marks: [],
    },
  ],
})

export const nano2TiptapReactPerformanceDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-react-performance-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap React Performance',
      marks: [],
    },
    {
      id: 'nano2-react-performance-target',
      type: 'paragraph',
      text: 'Host renders and editor transactions update NanoDocument state without remounting the editor view.',
      marks: [],
    },
    {
      id: 'nano2-react-performance-observer',
      type: 'paragraph',
      text: 'Derived stats read NanoDocument data directly.',
      marks: [],
    },
  ],
})

export const nano2TiptapLintingDocument: NanoDocument = NanoDocumentSchema.parse({
  blocks: [
    {
      id: 'nano2-linting-title',
      type: 'heading',
      level: 1,
      text: 'Tiptap Linting',
      marks: [],
    },
    {
      id: 'nano2-linting-target',
      type: 'paragraph',
      text: 'This is teh linting paragraph with very very clear signal.',
      marks: [],
    },
    {
      id: 'nano2-linting-space',
      type: 'paragraph',
      text: 'Extra  spacing stays a fixable NanoDocument text change.',
      marks: [],
    },
  ],
})
