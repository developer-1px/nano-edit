import { z } from 'zod'

export const NanoBlockIdSchema = z.string()
  .min(1)
  .refine((id) => id.trim().length > 0, 'Block id must not be blank')
