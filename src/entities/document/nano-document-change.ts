// @ts-nocheck
import type { JSONPatchOperation, Pointer, SelectionSnap } from '@interactive-os/json-document';
import { z } from 'zod';
import type { NanoDocumentEngine } from './nano-document.js';
import type { NanoDocument } from './nano-document-model.js';
import { nanoBlockAttrsEqual, nanoBlockEqual } from './nano-document-equality.js';
import { NanoDocumentJsonPatchOperationSchema, NanoDocumentJsonPointerSchema, NanoDocumentNonBlankStringSchema, NanoDocumentSelectionSnapSchema, } from './nano-document-payload-schema.js';
import { blockTextPointer, replaceBlocksPatch, } from './nano-document-selection.js';
const NanoDocumentChangeSchema = z.object({
    kind: z.literal('nano-document.change'),
    label: NanoDocumentNonBlankStringSchema,
    mergePath: NanoDocumentJsonPointerSchema.nullish(),
    operations: z.array(NanoDocumentJsonPatchOperationSchema),
    origin: NanoDocumentNonBlankStringSchema,
    selection: NanoDocumentSelectionSnapSchema.nullish(),
}).strict();
export interface NanoDocumentChange {
    kind: 'nano-document.change';
    label: string;
    mergePath?: Pointer | null;
    operations: ReadonlyArray<JSONPatchOperation>;
    origin: string;
    selection?: SelectionSnap | null;
}
export type NanoDocumentChangeCommitResult = ReturnType<NanoDocumentEngine['commit']>;
export type NanoDocumentChangeDocument = NanoDocument;
export function createNanoDocumentChange(options: {
    label: string;
    mergePath?: Pointer | null;
    operations: ReadonlyArray<JSONPatchOperation>;
    origin: string;
    selection?: SelectionSnap | null;
}): NanoDocumentChange {
    assertNanoDocumentChangeText('label', options.label);
    assertNanoDocumentChangeText('origin', options.origin);
    return {
        kind: 'nano-document.change',
        label: options.label,
        mergePath: options.mergePath ?? null,
        operations: options.operations,
        origin: options.origin,
        selection: options.selection ?? null,
    };
}
function assertNanoDocumentChangeText(name, value) {
    if (NanoDocumentNonBlankStringSchema.safeParse(value).success)
        return;
    throw new Error(`Nano Document change ${name} must not be blank`);
}
export function parseNanoDocumentChange(payload: unknown): NanoDocumentChange | null {
    const result = NanoDocumentChangeSchema.safeParse(payload);
    return result.success ? result.data : null;
}
export function isNanoDocumentChange(payload: unknown): payload is NanoDocumentChange {
    return parseNanoDocumentChange(payload) !== null;
}
export function nanoDocumentChangeFromDocuments(previous: NanoDocument, next: NanoDocument, options: {
    label: string;
    origin: string;
    selection?: SelectionSnap | null;
}): NanoDocumentChange | null {
    const operations = nanoDocumentPatchFromDocuments(previous, next);
    if (operations.length === 0)
        return null;
    return createNanoDocumentChange({
        label: options.label,
        mergePath: textMergePathForDocuments(previous, next),
        operations,
        origin: options.origin,
        selection: options.selection ?? null,
    });
}
export function nanoDocumentPatchFromDocuments(previous: NanoDocument, next: NanoDocument): JSONPatchOperation[] {
    const path = narrowReplacePathForDocuments(previous, next);
    if (path) {
        return [{ op: 'replace', path, value: valueAtPointer(next, path) }];
    }
    const tableCellPatch = narrowTableCellPatchForDocuments(previous, next);
    if (tableCellPatch)
        return tableCellPatch;
    const blockMovePatch = narrowBlockMovePatch(previous.blocks, next.blocks);
    if (blockMovePatch)
        return blockMovePatch;
    const blockPatch = narrowBlockArrayPatch(previous.blocks, next.blocks);
    if (blockPatch)
        return blockPatch;
    return replaceBlocksPatch(previous, next.blocks);
}
export function nanoDocumentChangeMergeKey(change: NanoDocumentChange): string | undefined {
    return change.mergePath ? `text:${change.mergePath}` : undefined;
}
export function commitNanoDocumentChange(
    engine: NanoDocumentEngine,
    change: NanoDocumentChange,
): ReturnType<NanoDocumentEngine['commit']> {
    return engine.commit(change.operations, {
        label: change.label,
        mergeKey: nanoDocumentChangeMergeKey(change),
        origin: change.origin,
        selectionAfter: change.selection ?? undefined,
    });
}
export function textMergePathForDocuments(previous: NanoDocument, next: NanoDocument): Pointer | null {
    if (previous.blocks.length !== next.blocks.length)
        return null;
    const changedBlockIndexes = next.blocks
        .map((block, index) => {
        const previousBlock = previous.blocks[index];
        return previousBlock && nanoBlockEqual(block, previousBlock) ? -1 : index;
    })
        .filter((index) => index >= 0);
    if (changedBlockIndexes.length !== 1)
        return null;
    const index = changedBlockIndexes[0];
    if (index === undefined)
        return null;
    const current = previous.blocks[index];
    const candidate = next.blocks[index];
    if (!current || !candidate)
        return null;
    if (current.id !== candidate.id || current.type !== candidate.type)
        return null;
    if (textBlockMergeable(current, candidate))
        return blockTextPointer(index);
    if (current.type === 'table' && candidate.type === 'table') {
        return tableCellMergePath(index, current.rows, candidate.rows);
    }
    return null;
}
function narrowReplacePathForDocuments(previous, next) {
    if (previous.blocks.length !== next.blocks.length)
        return null;
    const changedBlockIndexes = next.blocks
        .map((block, index) => {
        const previousBlock = previous.blocks[index];
        return previousBlock && nanoBlockEqual(block, previousBlock) ? -1 : index;
    })
        .filter((index) => index >= 0);
    if (changedBlockIndexes.length !== 1)
        return null;
    const index = changedBlockIndexes[0];
    if (index === undefined)
        return null;
    const current = previous.blocks[index];
    const candidate = next.blocks[index];
    if (!current || !candidate)
        return null;
    if (current.id !== candidate.id || current.type !== candidate.type)
        return null;
    if (textReplaceable(current, candidate))
        return blockTextPointer(index);
    if (current.type === 'table' && candidate.type === 'table') {
        if (!nanoBlockAttrsEqual(current, candidate, ['rows']))
            return null;
        return tableCellMergePath(index, current.rows, candidate.rows);
    }
    return null;
}
function narrowTableCellPatchForDocuments(previous, next) {
    if (previous.blocks.length !== next.blocks.length)
        return null;
    const changedBlockIndexes = next.blocks
        .map((block, index) => {
        const previousBlock = previous.blocks[index];
        return previousBlock && nanoBlockEqual(block, previousBlock) ? -1 : index;
    })
        .filter((index) => index >= 0);
    if (changedBlockIndexes.length !== 1)
        return null;
    const index = changedBlockIndexes[0];
    if (index === undefined)
        return null;
    const current = previous.blocks[index];
    const candidate = next.blocks[index];
    if (!current || !candidate)
        return null;
    if (current.id !== candidate.id || current.type !== 'table' || candidate.type !== 'table')
        return null;
    if (!nanoBlockAttrsEqual(current, candidate, ['rows']))
        return null;
    if (current.rows.length !== candidate.rows.length)
        return null;
    const operations = [];
    for (const [rowIndex, row] of candidate.rows.entries()) {
        const currentRow = current.rows[rowIndex];
        if (!currentRow || currentRow.length !== row.length)
            return null;
        for (const [columnIndex, value] of row.entries()) {
            if (value === currentRow[columnIndex])
                continue;
            operations.push({
                op: 'replace',
                path: `/blocks/${index}/rows/${rowIndex}/${columnIndex}`,
                value,
            });
        }
    }
    return operations.length > 0 ? operations : null;
}
function narrowBlockMovePatch(previousBlocks, nextBlocks) {
    if (previousBlocks.length !== nextBlocks.length)
        return null;
    if (previousBlocks.length < 2)
        return null;
    for (let sourceIndex = 0; sourceIndex < previousBlocks.length; sourceIndex += 1) {
        const block = previousBlocks[sourceIndex];
        if (!block)
            continue;
        const remaining = [
            ...previousBlocks.slice(0, sourceIndex),
            ...previousBlocks.slice(sourceIndex + 1),
        ];
        for (let targetIndex = 0; targetIndex < nextBlocks.length; targetIndex += 1) {
            if (targetIndex === sourceIndex)
                continue;
            const candidate = [
                ...remaining.slice(0, targetIndex),
                block,
                ...remaining.slice(targetIndex),
            ];
            if (!blockArraysEqual(candidate, nextBlocks))
                continue;
            return [{
                    from: `/blocks/${sourceIndex}`,
                    op: 'move',
                    path: `/blocks/${targetIndex}`,
                }];
        }
    }
    return null;
}
function narrowBlockArrayPatch(previousBlocks, nextBlocks) {
    if (previousBlocks.length === nextBlocks.length) {
        const index = firstDifferentBlockIndex(previousBlocks, nextBlocks);
        if (index === null)
            return [];
        return matchingBlockSuffix(previousBlocks, nextBlocks, index + 1, index + 1)
            ? [{ op: 'replace', path: `/blocks/${index}`, value: nextBlocks[index] }]
            : null;
    }
    if (nextBlocks.length === previousBlocks.length + 1) {
        const index = firstInsertIndex(previousBlocks, nextBlocks);
        return index === null
            ? null
            : [{ op: 'add', path: `/blocks/${index}`, value: nextBlocks[index] }];
    }
    if (previousBlocks.length === nextBlocks.length + 1) {
        const index = firstRemoveIndex(previousBlocks, nextBlocks);
        return index === null
            ? null
            : [{ op: 'remove', path: `/blocks/${index}` }];
    }
    return null;
}
function blockArraysEqual(left, right) {
    return left.length === right.length
        && left.every((block, index) => {
            const candidate = right[index];
            return candidate !== undefined && nanoBlockEqual(block, candidate);
        });
}
function firstDifferentBlockIndex(previousBlocks, nextBlocks) {
    for (let index = 0; index < previousBlocks.length; index += 1) {
        const previousBlock = previousBlocks[index];
        const nextBlock = nextBlocks[index];
        if (!previousBlock || !nextBlock || !nanoBlockEqual(previousBlock, nextBlock))
            return index;
    }
    return null;
}
function firstInsertIndex(previousBlocks, nextBlocks) {
    for (let index = 0; index < nextBlocks.length; index += 1) {
        const previousBlock = previousBlocks[index];
        const nextBlock = nextBlocks[index];
        if (!previousBlock || !nextBlock || !nanoBlockEqual(previousBlock, nextBlock)) {
            return matchingBlockSuffix(previousBlocks, nextBlocks, index, index + 1) ? index : null;
        }
    }
    return null;
}
function firstRemoveIndex(previousBlocks, nextBlocks) {
    for (let index = 0; index < previousBlocks.length; index += 1) {
        const previousBlock = previousBlocks[index];
        const nextBlock = nextBlocks[index];
        if (!previousBlock || !nextBlock || !nanoBlockEqual(previousBlock, nextBlock)) {
            return matchingBlockSuffix(previousBlocks, nextBlocks, index + 1, index) ? index : null;
        }
    }
    return null;
}
function matchingBlockSuffix(previousBlocks, nextBlocks, previousStart, nextStart) {
    if (previousBlocks.length - previousStart !== nextBlocks.length - nextStart)
        return false;
    for (let offset = 0; previousStart + offset < previousBlocks.length; offset += 1) {
        const previousBlock = previousBlocks[previousStart + offset];
        const nextBlock = nextBlocks[nextStart + offset];
        if (!previousBlock || !nextBlock || !nanoBlockEqual(previousBlock, nextBlock))
            return false;
    }
    return true;
}
function valueAtPointer(document, path) {
    return path.split('/').slice(1).reduce((value, segment) => {
        if (Array.isArray(value))
            return value[Number(segment)];
        if (isRecord(value))
            return value[segment];
        return undefined;
    }, document);
}
function textBlockMergeable(current, candidate) {
    if (!('text' in current) || !('text' in candidate))
        return false;
    if (current.text === candidate.text)
        return false;
    return nanoBlockAttrsEqual(current, candidate, ['marks', 'text']);
}
function textReplaceable(current, candidate) {
    if (!('text' in current) || !('text' in candidate))
        return false;
    if (current.text === candidate.text)
        return false;
    return nanoBlockAttrsEqual(current, candidate, ['text']);
}
function tableCellMergePath(index, currentRows, nextRows) {
    if (currentRows.length !== nextRows.length)
        return null;
    const changedCells = [];
    for (const [rowIndex, row] of nextRows.entries()) {
        const currentRow = currentRows[rowIndex];
        if (!currentRow || currentRow.length !== row.length)
            return null;
        for (const [columnIndex, value] of row.entries()) {
            if (value !== currentRow[columnIndex])
                changedCells.push({ column: columnIndex, row: rowIndex });
        }
    }
    if (changedCells.length !== 1)
        return null;
    const cell = changedCells[0];
    if (!cell)
        return null;
    return `/blocks/${index}/rows/${cell.row}/${cell.column}`;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
