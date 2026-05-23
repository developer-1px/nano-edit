import { z } from 'zod'
import { createBasicBlockSchemas } from './capabilities/basic/schema'
import { NanoMarkSchema } from './nano-mark-schema'
import { atomicBlockSchemas } from './nano-block-schema-atomic'
import { richTextBlockSchemas } from './nano-block-schema-rich-text'

export const NanoBlockSchema = z.discriminatedUnion('type', [
  ...createBasicBlockSchemas(NanoMarkSchema),
  ...richTextBlockSchemas,
  ...atomicBlockSchemas,
])
