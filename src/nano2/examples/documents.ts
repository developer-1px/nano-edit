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
