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
