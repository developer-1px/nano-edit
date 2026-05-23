import { z } from 'zod'

export const NonBlankStringSchema = z.string().refine((value) => value.trim().length > 0, {
  message: 'Value must not be blank',
})

export function nonBlankStringValue(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : null
}

export function textLineCount(text: string): number {
  return text.split('\n').length
}

export function continuationLineCount(text: string): number {
  return Math.max(0, textLineCount(text) - 1)
}

export function addArrayLengthIssue(
  ctx: z.RefinementCtx,
  path: string,
  actual: number | undefined,
  expected: number,
): void {
  if (actual === undefined || actual === expected) return

  ctx.addIssue({
    code: 'custom',
    message: `${path} length ${actual}; expected ${expected}`,
    path: [path],
  })
}
