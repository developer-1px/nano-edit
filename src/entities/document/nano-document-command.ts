// @ts-nocheck
import type { SelectionSnap } from '@interactive-os/json-document';
import { z } from 'zod';
import type { NanoDocumentEngine } from './nano-document.js';
import type { NanoDocumentChange } from './nano-document-change.js';
import type { NanoBlock, NanoDocument } from './nano-document-model.js';
import { NanoBlockSchema } from '../block/schema/nano-block-schema.js';
import { commitNanoDocumentChange, nanoDocumentChangeFromDocuments, } from './nano-document-change.js';
import { NanoDocumentSchema } from './nano-document-model.js';
import { NanoDocumentNonBlankStringSchema, NanoDocumentSelectionSnapSchema, } from './nano-document-payload-schema.js';
const NanoDocumentCommandOptionsSchema = z.object({
    label: NanoDocumentNonBlankStringSchema.optional(),
    origin: NanoDocumentNonBlankStringSchema.optional(),
    selection: NanoDocumentSelectionSnapSchema.nullish(),
}).strict();
const NanoDocumentBlockTargetSchema = z.union([
    z.object({
        blockId: z.string().min(1),
        blockIndex: z.never().optional(),
    }).strict(),
    z.object({
        blockId: z.never().optional(),
        blockIndex: z.number().int().nonnegative(),
    }).strict(),
]);
const NanoDocumentInsertPositionSchema = z.union([
    z.object({
        afterBlockId: z.string().min(1),
        beforeBlockId: z.never().optional(),
        index: z.never().optional(),
    }).strict(),
    z.object({
        afterBlockId: z.never().optional(),
        beforeBlockId: z.string().min(1),
        index: z.never().optional(),
    }).strict(),
    z.object({
        afterBlockId: z.never().optional(),
        beforeBlockId: z.never().optional(),
        index: z.number().int().nonnegative(),
    }).strict(),
]);
const NanoDocumentCommandSchema = z.discriminatedUnion('kind', [
    NanoDocumentCommandOptionsSchema.extend({
        kind: z.literal('nano-document.command.set-text'),
        target: NanoDocumentBlockTargetSchema,
        text: z.string(),
    }).strict(),
    NanoDocumentCommandOptionsSchema.extend({
        column: z.number().int().nonnegative(),
        kind: z.literal('nano-document.command.set-table-cell'),
        row: z.number().int().nonnegative(),
        target: NanoDocumentBlockTargetSchema,
        text: z.string(),
    }).strict(),
    NanoDocumentCommandOptionsSchema.extend({
        block: NanoBlockSchema,
        kind: z.literal('nano-document.command.replace-block'),
        target: NanoDocumentBlockTargetSchema,
    }).strict(),
    NanoDocumentCommandOptionsSchema.extend({
        at: NanoDocumentInsertPositionSchema,
        block: NanoBlockSchema,
        kind: z.literal('nano-document.command.insert-block'),
    }).strict(),
    NanoDocumentCommandOptionsSchema.extend({
        kind: z.literal('nano-document.command.move-block'),
        target: NanoDocumentBlockTargetSchema,
        to: NanoDocumentInsertPositionSchema,
    }).strict(),
    NanoDocumentCommandOptionsSchema.extend({
        kind: z.literal('nano-document.command.remove-block'),
        target: NanoDocumentBlockTargetSchema,
    }).strict(),
]);
const commandOrigin = 'nano-document-command';
export type NanoDocumentBlockTarget = {
    blockId: string;
    blockIndex?: never;
} | {
    blockId?: never;
    blockIndex: number;
};
export type NanoDocumentInsertPosition = {
    afterBlockId: string;
    beforeBlockId?: never;
    index?: never;
} | {
    afterBlockId?: never;
    beforeBlockId: string;
    index?: never;
} | {
    afterBlockId?: never;
    beforeBlockId?: never;
    index: number;
};
export type NanoDocumentCommand = NanoDocumentSetTextCommand | NanoDocumentSetTableCellCommand | NanoDocumentReplaceBlockCommand | NanoDocumentInsertBlockCommand | NanoDocumentMoveBlockCommand | NanoDocumentRemoveBlockCommand;
export interface NanoDocumentCommandOptions {
    label?: string;
    origin?: string;
    selection?: SelectionSnap | null;
}
export interface NanoDocumentSetTextCommand extends NanoDocumentCommandOptions {
    kind: 'nano-document.command.set-text';
    target: NanoDocumentBlockTarget;
    text: string;
}
export interface NanoDocumentSetTableCellCommand extends NanoDocumentCommandOptions {
    column: number;
    kind: 'nano-document.command.set-table-cell';
    row: number;
    target: NanoDocumentBlockTarget;
    text: string;
}
export interface NanoDocumentReplaceBlockCommand extends NanoDocumentCommandOptions {
    block: NanoBlock;
    kind: 'nano-document.command.replace-block';
    target: NanoDocumentBlockTarget;
}
export interface NanoDocumentInsertBlockCommand extends NanoDocumentCommandOptions {
    at: NanoDocumentInsertPosition;
    block: NanoBlock;
    kind: 'nano-document.command.insert-block';
}
export interface NanoDocumentMoveBlockCommand extends NanoDocumentCommandOptions {
    kind: 'nano-document.command.move-block';
    target: NanoDocumentBlockTarget;
    to: NanoDocumentInsertPosition;
}
export interface NanoDocumentRemoveBlockCommand extends NanoDocumentCommandOptions {
    kind: 'nano-document.command.remove-block';
    target: NanoDocumentBlockTarget;
}
export interface NanoDocumentCommandSuccess {
    change: NanoDocumentChange | null;
    ok: true;
}
export interface NanoDocumentCommandFailure {
    code: 'schema_violation' | 'target_not_found' | 'unsupported_block';
    ok: false;
    reason: string;
}
export type NanoDocumentCommandResult = NanoDocumentCommandFailure | NanoDocumentCommandSuccess;
export type NanoDocumentCommandCommitResult = NanoDocumentCommandFailure | ReturnType<NanoDocumentEngine['commit']> | {
    ok: true;
};
export function parseNanoDocumentCommand(payload: unknown): NanoDocumentCommand | null {
    const result = NanoDocumentCommandSchema.safeParse(payload);
    return result.success ? result.data : null;
}
export function isNanoDocumentCommand(payload: unknown): payload is NanoDocumentCommand {
    return parseNanoDocumentCommand(payload) !== null;
}
export function nanoDocumentChangeFromCommand(
    document: NanoDocument,
    command: NanoDocumentCommand,
): NanoDocumentCommandResult {
    const nextDocument = nextDocumentForCommand(document, command);
    if (!nextDocument.ok)
        return nextDocument;
    const change = nanoDocumentChangeFromDocuments(document, nextDocument.document, {
        label: command.label ?? nanoDocumentCommandLabel(command),
        origin: command.origin ?? commandOrigin,
        selection: command.selection ?? null,
    });
    return { ok: true, change };
}
export function commitNanoDocumentCommand(
    engine: NanoDocumentEngine,
    command: NanoDocumentCommand,
): NanoDocumentCommandCommitResult {
    const result = nanoDocumentChangeFromCommand(engine.value, command);
    if (!result.ok)
        return result;
    if (!result.change)
        return { ok: true };
    return commitNanoDocumentChange(engine, result.change);
}
export function nanoDocumentCommandLabel(command: NanoDocumentCommand): string {
    return command.kind.slice('nano-document.command.'.length);
}
function nextDocumentForCommand(document, command) {
    switch (command.kind) {
        case 'nano-document.command.set-text':
            return setTextBlock(document, command);
        case 'nano-document.command.set-table-cell':
            return setTableCell(document, command);
        case 'nano-document.command.replace-block':
            return replaceBlock(document, command);
        case 'nano-document.command.insert-block':
            return insertBlock(document, command);
        case 'nano-document.command.move-block':
            return moveBlock(document, command);
        case 'nano-document.command.remove-block':
            return removeBlock(document, command);
    }
}
function setTextBlock(document, command) {
    const blockIndex = blockIndexForTarget(document, command.target);
    if (blockIndex === null)
        return targetFailure(command.target);
    const block = document.blocks[blockIndex];
    if (!block || !('text' in block)) {
        return unsupportedFailure(command.target, 'target block does not contain editable text');
    }
    const nextBlock = 'marks' in block && Array.isArray(block.marks)
        ? { ...block, text: command.text, marks: clampMarks(block.marks, command.text.length) }
        : { ...block, text: command.text };
    return parseNextDocument({
        blocks: replaceArrayItem(document.blocks, blockIndex, nextBlock),
    });
}
function setTableCell(document, command) {
    const blockIndex = blockIndexForTarget(document, command.target);
    if (blockIndex === null)
        return targetFailure(command.target);
    const block = document.blocks[blockIndex];
    if (!block || block.type !== 'table') {
        return unsupportedFailure(command.target, 'target block is not a table');
    }
    const row = block.rows[command.row];
    if (!row || row[command.column] === undefined) {
        return targetFailure(command.target, `table cell not found at ${command.row}:${command.column}`);
    }
    const nextRows = block.rows.map((currentRow, rowIndex) => (rowIndex === command.row
        ? replaceArrayItem(currentRow, command.column, command.text)
        : [...currentRow]));
    return parseNextDocument({
        blocks: replaceArrayItem(document.blocks, blockIndex, { ...block, rows: nextRows }),
    });
}
function replaceBlock(document, command) {
    const blockIndex = blockIndexForTarget(document, command.target);
    if (blockIndex === null)
        return targetFailure(command.target);
    return parseNextDocument({
        blocks: replaceArrayItem(document.blocks, blockIndex, command.block),
    });
}
function insertBlock(document, command) {
    const index = insertIndexForPosition(document, command.at);
    if (index === null)
        return targetFailure(command.at);
    return parseNextDocument({
        blocks: [
            ...document.blocks.slice(0, index),
            command.block,
            ...document.blocks.slice(index),
        ],
    });
}
function moveBlock(document, command) {
    const sourceIndex = blockIndexForTarget(document, command.target);
    if (sourceIndex === null)
        return targetFailure(command.target);
    const insertIndex = insertIndexForPosition(document, command.to);
    if (insertIndex === null)
        return targetFailure(command.to);
    const block = document.blocks[sourceIndex];
    if (!block)
        return targetFailure(command.target);
    const targetIndex = insertIndex > sourceIndex ? insertIndex - 1 : insertIndex;
    const blocksWithoutSource = [
        ...document.blocks.slice(0, sourceIndex),
        ...document.blocks.slice(sourceIndex + 1),
    ];
    return parseNextDocument({
        blocks: [
            ...blocksWithoutSource.slice(0, targetIndex),
            block,
            ...blocksWithoutSource.slice(targetIndex),
        ],
    });
}
function removeBlock(document, command) {
    const blockIndex = blockIndexForTarget(document, command.target);
    if (blockIndex === null)
        return targetFailure(command.target);
    return parseNextDocument({
        blocks: [
            ...document.blocks.slice(0, blockIndex),
            ...document.blocks.slice(blockIndex + 1),
        ],
    });
}
function blockIndexForTarget(document, target) {
    if (target.blockId !== undefined) {
        const index = document.blocks.findIndex((block) => block.id === target.blockId);
        return index >= 0 ? index : null;
    }
    return target.blockIndex >= 0 && target.blockIndex < document.blocks.length
        ? target.blockIndex
        : null;
}
function insertIndexForPosition(document, position) {
    if (position.index !== undefined) {
        return position.index >= 0 && position.index <= document.blocks.length
            ? position.index
            : null;
    }
    if (position.beforeBlockId !== undefined) {
        const index = document.blocks.findIndex((block) => block.id === position.beforeBlockId);
        return index >= 0 ? index : null;
    }
    const index = document.blocks.findIndex((block) => block.id === position.afterBlockId);
    return index >= 0 ? index + 1 : null;
}
function parseNextDocument(document) {
    const result = NanoDocumentSchema.safeParse(document);
    if (!result.success) {
        return {
            ok: false,
            code: 'schema_violation',
            reason: result.error.issues[0]?.message ?? 'Nano Document command produced an invalid document',
        };
    }
    return { ok: true, document: result.data };
}
function clampMarks(marks, textLength) {
    return marks
        .map((mark) => ({
        ...mark,
        from: Math.min(mark.from, textLength),
        to: Math.min(mark.to, textLength),
    }))
        .filter((mark) => mark.from < mark.to);
}
function replaceArrayItem(items, index, value) {
    return items.map((item, currentIndex) => currentIndex === index ? value : item);
}
function targetFailure(target, reason = 'Nano Document command target was not found') {
    return {
        ok: false,
        code: 'target_not_found',
        reason: `${reason}: ${JSON.stringify(target)}`,
    };
}
function unsupportedFailure(target, reason) {
    return {
        ok: false,
        code: 'unsupported_block',
        reason: `${reason}: ${JSON.stringify(target)}`,
    };
}
