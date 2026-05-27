import { createJSONDocument } from 'zod-crud'
import type { JSONDocument } from 'zod-crud'
import { z } from 'zod'
import { NanoBlockSchema } from '../block/schema/nano-block-schema'

const NanoDeckIdSchema = z.string()
  .min(1)
  .refine((id) => id.trim().length > 0, 'Deck id must not be blank')

const NanoDeckMetadataValueSchema = z.union([z.string(), z.number(), z.boolean()])

export const NanoDeckMetadataSchema = z.record(z.string().min(1), NanoDeckMetadataValueSchema)
export const NanoSlideRegionKindSchema = z.enum(['title', 'body', 'notes'])

export const NanoSlideRegionSchema = z.object({
  blocks: z.array(NanoBlockSchema).min(1),
  id: NanoDeckIdSchema,
  kind: NanoSlideRegionKindSchema,
})

export const NanoSlideSchema = z.object({
  id: NanoDeckIdSchema,
  layout: NanoDeckIdSchema,
  metadata: NanoDeckMetadataSchema.optional(),
  regions: z.array(NanoSlideRegionSchema).min(1),
})

export const NanoDeckSchema = z.object({
  id: NanoDeckIdSchema,
  metadata: NanoDeckMetadataSchema.optional(),
  slides: z.array(NanoSlideSchema).min(1),
  title: z.string().optional(),
}).superRefine((deck, ctx) => {
  const slideIds = new Set<string>()
  const blockIds = new Set<string>()

  for (const [slideIndex, slide] of deck.slides.entries()) {
    addUniqueIdIssue(ctx, slideIds, slide.id, ['slides', slideIndex, 'id'], 'Duplicate slide id')
    validateSlideRegions(ctx, slide, slideIndex, blockIds)
  }
})

export type NanoDeckMetadata = z.infer<typeof NanoDeckMetadataSchema>
export type NanoSlideRegionKind = z.infer<typeof NanoSlideRegionKindSchema>
export type NanoSlideRegion = z.infer<typeof NanoSlideRegionSchema>
export type NanoSlide = z.infer<typeof NanoSlideSchema>
export type NanoDeck = z.infer<typeof NanoDeckSchema>
export type NanoDeckEngine = JSONDocument<NanoDeck>

export function createEmptyNanoDeck(): NanoDeck {
  return {
    id: 'deck-1',
    slides: [{
      id: 'slide-1',
      layout: 'default',
      regions: [{
        id: 'slide-1-title',
        kind: 'title',
        blocks: [{ id: 'slide-1-title-1', type: 'heading', level: 1, text: 'Untitled Deck', marks: [] }],
      }],
    }],
    title: 'Untitled Deck',
  }
}

export const emptyNanoDeck: NanoDeck = createEmptyNanoDeck()

export function createNanoDeck(initialDeck: NanoDeck = createEmptyNanoDeck()): NanoDeckEngine {
  return createJSONDocument(NanoDeckSchema, initialDeck, {
    history: 200,
  })
}

function validateSlideRegions(
  ctx: z.RefinementCtx,
  slide: NanoSlide,
  slideIndex: number,
  blockIds: Set<string>,
): void {
  const regionIds = new Set<string>()
  let hasVisibleRegion = false
  let titleRegionCount = 0
  let notesRegionCount = 0

  for (const [regionIndex, region] of slide.regions.entries()) {
    addUniqueIdIssue(ctx, regionIds, region.id, ['slides', slideIndex, 'regions', regionIndex, 'id'], 'Duplicate slide region id')
    if (region.kind !== 'notes') hasVisibleRegion = true
    if (region.kind === 'title') titleRegionCount += 1
    if (region.kind === 'notes') notesRegionCount += 1

    for (const [blockIndex, block] of region.blocks.entries()) {
      addUniqueIdIssue(
        ctx,
        blockIds,
        block.id,
        ['slides', slideIndex, 'regions', regionIndex, 'blocks', blockIndex, 'id'],
        'Duplicate deck block id',
      )
      validateTextBlockMarks(ctx, block, ['slides', slideIndex, 'regions', regionIndex, 'blocks', blockIndex])
    }
  }

  if (!hasVisibleRegion) {
    ctx.addIssue({
      code: 'custom',
      message: 'Slide must contain at least one visible region',
      path: ['slides', slideIndex, 'regions'],
    })
  }

  if (titleRegionCount > 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Slide must not contain more than one title region',
      path: ['slides', slideIndex, 'regions'],
    })
  }

  if (notesRegionCount > 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Slide must not contain more than one notes region',
      path: ['slides', slideIndex, 'regions'],
    })
  }
}

function addUniqueIdIssue(
  ctx: z.RefinementCtx,
  seen: Set<string>,
  id: string,
  path: (number | string)[],
  label: string,
): void {
  if (!seen.has(id)) {
    seen.add(id)
    return
  }

  ctx.addIssue({
    code: 'custom',
    message: `${label}: ${id}`,
    path,
  })
}

function validateTextBlockMarks(
  ctx: z.RefinementCtx,
  block: z.infer<typeof NanoBlockSchema>,
  path: (number | string)[],
): void {
  if (!('text' in block) || !('marks' in block)) return

  for (const [markIndex, mark] of block.marks.entries()) {
    if (mark.to <= block.text.length) continue

    ctx.addIssue({
      code: 'custom',
      message: `Mark range exceeds block text length: ${mark.to} > ${block.text.length}`,
      path: [...path, 'marks', markIndex, 'to'],
    })
  }
}
