import { z } from 'zod'
import { createTextBlockBaseSchema } from '../../../capabilities/text-block-schema'
import { NanoBlockIdSchema } from './nano-block-id-schema'
import { NanoMarkSchema } from '../../mark/nano-mark-schema'
import { atomicBlockSchemas } from './nano-block-schema-atomic'
import { richTextBlockSchemas } from './nano-block-schema-rich-text'

export type NanoCustomBlockType = `${string}.${string}`
export type NanoCustomBlock = {
  id: string
  type: NanoCustomBlockType
  data?: Record<string, unknown>
  marks?: z.infer<typeof NanoMarkSchema>[]
  text?: string
}
export type NanoKnownBlock = z.infer<typeof NanoKnownBlockSchema>
export type NanoBlock = NanoKnownBlock | NanoCustomBlock

export const NanoKnownBlockSchema = z.discriminatedUnion('type', [
  ...createBasicBlockSchemas(NanoMarkSchema),
  ...richTextBlockSchemas,
  ...atomicBlockSchemas,
])

export const NanoCustomBlockTypeSchema = z.string()
  .regex(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/) as z.ZodType<NanoCustomBlockType>

const NanoCustomBlockJsonValueSchema = z.unknown().refine(
  isNanoCustomBlockJsonValue,
  'expected a JSON-serializable custom block value',
)

export const NanoCustomBlockSchema = z.object({
  id: NanoBlockIdSchema,
  type: NanoCustomBlockTypeSchema,
  text: z.string().optional(),
  marks: z.array(NanoMarkSchema).optional(),
  data: z.record(z.string(), NanoCustomBlockJsonValueSchema).optional(),
}).strict() satisfies z.ZodType<NanoCustomBlock>

export const NanoBlockSchema: z.ZodType<NanoBlock> = z.union([
  NanoKnownBlockSchema,
  NanoCustomBlockSchema,
])

export function isNanoCustomBlock(block: NanoBlock): block is NanoCustomBlock {
  return NanoCustomBlockSchema.safeParse(block).success
}

function createBasicBlockSchemas<TMark extends z.ZodTypeAny>(markSchema: TMark) {
  const textBlockBaseSchema = createTextBlockBaseSchema(markSchema)

  return [
    textBlockBaseSchema.extend({ type: z.literal('paragraph') }),
    textBlockBaseSchema.extend({
      type: z.literal('heading'),
      level: z.number().int().min(1).max(6),
      headingStyle: z.enum(['atx', 'setext']).optional(),
      atxClosingLength: z.number().int().min(1).optional(),
      atxClosingSpacing: z.number().int().min(1).optional(),
      atxTextSpacing: z.number().int().min(1).optional(),
      setextMarker: z.enum(['=', '-']).optional(),
      setextLength: z.number().int().min(1).optional(),
    }),
  ] as const
}

function isNanoCustomBlockJsonValue(value: unknown): boolean {
  if (value === null) return true

  switch (typeof value) {
    case 'boolean':
    case 'string':
      return true
    case 'number':
      return Number.isFinite(value)
    case 'object': {
      if (Array.isArray(value)) return value.every(isNanoCustomBlockJsonValue)

      const prototype = Object.getPrototypeOf(value)
      if (prototype !== Object.prototype && prototype !== null) return false

      return Object.values(value as Record<string, unknown>).every(isNanoCustomBlockJsonValue)
    }
    default:
      return false
  }
}
