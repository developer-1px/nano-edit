import { z } from 'zod';
import { NanoBlockSchema, } from '../block/schema/nano-block-schema.js';
import type { NanoCustomBlock, NanoCustomBlockType } from '../block/schema/nano-block-schema.js';
import { NanoMarkSchema } from '../mark/nano-mark-schema.js';
export type NanoMark = z.infer<typeof NanoMarkSchema>;
export type NanoBlock = z.infer<typeof NanoBlockSchema>;
export interface NanoDocument {
    blocks: NanoBlock[];
}
const NanoDocumentBlocksSchema = z.array(NanoBlockSchema)
    .min(1)
    .superRefine((blocks: NanoBlock[], ctx) => {
    const seen = new Set<string>();
    for (const [index, block] of blocks.entries()) {
        if (!seen.has(block.id)) {
            seen.add(block.id);
        }
        else {
            ctx.addIssue({
                code: 'custom',
                message: `Duplicate block id: ${block.id}`,
                path: [index, 'id'],
            });
        }
        if (!('text' in block) || typeof block.text !== 'string' || !('marks' in block) || !Array.isArray(block.marks))
            continue;
        for (const [markIndex, mark] of block.marks.entries()) {
            if (mark.to <= block.text.length)
                continue;
            ctx.addIssue({
                code: 'custom',
                message: `Mark range exceeds block text length: ${mark.to} > ${block.text.length}`,
                path: [index, 'marks', markIndex, 'to'],
            });
        }
    }
});
export const NanoDocumentSchema = z.object({
    blocks: NanoDocumentBlocksSchema,
}).strict() satisfies z.ZodType<NanoDocument>;
export type { NanoCustomBlock, NanoCustomBlockType };
export interface CreateNanoParagraphBlockOptions {
    id: string;
    marks?: readonly NanoMark[];
    text?: string;
}
export type NanoParagraphBlock = Extract<NanoBlock, {
    type: 'paragraph';
}>;
export function createNanoParagraphBlock(options: CreateNanoParagraphBlockOptions): NanoParagraphBlock {
    return {
        id: options.id,
        marks: [...(options.marks ?? [])],
        text: options.text ?? '',
        type: 'paragraph',
    };
}
export function createEmptyNanoDocument(): NanoDocument {
    return {
        blocks: [createNanoParagraphBlock({ id: 'b1' })],
    };
}
export const emptyNanoDocument: NanoDocument = createEmptyNanoDocument();
