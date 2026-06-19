import { NanoDocumentSchema, type NanoDocument } from '../entities/document/nano-document-model'

export const Nano2ForcedStructureDocumentSchema = NanoDocumentSchema.superRefine((document, ctx) => {
  const [title, ...body] = document.blocks

  if (!title || title.type !== 'heading' || title.level !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Forced structure requires a level-one heading as the first block',
      path: ['blocks', 0],
    })
  }

  if (body.length === 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Forced structure requires at least one body block after the title',
      path: ['blocks'],
    })
  }

  for (const [index, block] of body.entries()) {
    if (block.type !== 'heading') continue

    ctx.addIssue({
      code: 'custom',
      message: 'Forced structure allows headings only in the title slot',
      path: ['blocks', index + 1, 'type'],
    })
  }
})

export function parseNano2ForcedStructureDocument(document: unknown): NanoDocument {
  return Nano2ForcedStructureDocumentSchema.parse(document)
}

export function isNano2ForcedStructureDocument(document: unknown): document is NanoDocument {
  return Nano2ForcedStructureDocumentSchema.safeParse(document).success
}
