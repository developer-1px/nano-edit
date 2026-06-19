import { z } from 'zod';
export const NanoDocumentNonBlankStringSchema = z.string().refine((value) => value.trim().length > 0, 'expected a non-blank string');
export const NanoDocumentJsonPointerSchema = z.string().refine(isNanoDocumentJsonPointer, 'expected a JSON Pointer');
export const NanoDocumentJsonValueSchema = z.unknown().refine(isNanoDocumentJsonValue, 'expected a JSON-serializable value');
export const NanoDocumentJsonPatchOperationSchema = z.discriminatedUnion('op', [
    z.object({ op: z.literal('add'), path: NanoDocumentJsonPointerSchema, value: NanoDocumentJsonValueSchema }).strict(),
    z.object({ op: z.literal('remove'), path: NanoDocumentJsonPointerSchema }).strict(),
    z.object({ op: z.literal('replace'), path: NanoDocumentJsonPointerSchema, value: NanoDocumentJsonValueSchema }).strict(),
    z.object({ op: z.literal('move'), from: NanoDocumentJsonPointerSchema, path: NanoDocumentJsonPointerSchema }).strict(),
    z.object({ op: z.literal('copy'), from: NanoDocumentJsonPointerSchema, path: NanoDocumentJsonPointerSchema }).strict(),
    z.object({ op: z.literal('test'), path: NanoDocumentJsonPointerSchema, value: NanoDocumentJsonValueSchema }).strict(),
]);
export const NanoDocumentSelectionPointSchema = z.union([
    NanoDocumentJsonPointerSchema,
    z.object({
        offset: z.number().int().nonnegative().optional(),
        path: NanoDocumentJsonPointerSchema,
    }).strict(),
]);
export const NanoDocumentSelectionRangeSchema = z.object({
    anchor: NanoDocumentSelectionPointSchema,
    focus: NanoDocumentSelectionPointSchema,
}).strict();
export const NanoDocumentSelectionSnapSchema = z.object({
    anchor: NanoDocumentSelectionPointSchema,
    focus: NanoDocumentSelectionPointSchema,
    primaryIndex: z.number().int().nonnegative(),
    selectedPointers: z.array(NanoDocumentJsonPointerSchema),
    selectionRanges: z.array(NanoDocumentSelectionRangeSchema),
}).strict();
function isNanoDocumentJsonPointer(value: string): boolean {
    if (value === '')
        return true;
    if (!value.startsWith('/'))
        return false;
    for (let index = 0; index < value.length; index += 1) {
        if (value[index] !== '~')
            continue;
        const escapeCode = value[index + 1];
        if (escapeCode !== '0' && escapeCode !== '1')
            return false;
    }
    return true;
}
function isNanoDocumentJsonValue(value: unknown): boolean {
    if (value === null)
        return true;
    switch (typeof value) {
        case 'boolean':
        case 'string':
            return true;
        case 'number':
            return Number.isFinite(value);
        case 'object': {
            if (Array.isArray(value))
                return value.every(isNanoDocumentJsonValue);
            const prototype = Object.getPrototypeOf(value);
            if (prototype !== Object.prototype && prototype !== null)
                return false;
            return Object.values(value as Record<string, unknown>).every(isNanoDocumentJsonValue);
        }
        default:
            return false;
    }
}
