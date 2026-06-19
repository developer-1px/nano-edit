// @ts-nocheck
import type { Pointer } from '@interactive-os/json-document';
import { z } from 'zod';
import type { NanoDocumentEngine } from './nano-document.js';
import type { NanoDocumentChange } from './nano-document-change.js';
import { commitNanoDocumentChange, createNanoDocumentChange, parseNanoDocumentChange, } from './nano-document-change.js';
import { NanoDocumentNonBlankStringSchema } from './nano-document-payload-schema.js';
const NanoDocumentCollaborationRevisionSchema = z.union([
    z.number().int().nonnegative(),
    NanoDocumentNonBlankStringSchema,
]);
const NanoDocumentCollaborationChangeSchema = z.object({
    kind: z.literal('nano-document.collaboration-change'),
    change: z.unknown(),
    peerId: NanoDocumentNonBlankStringSchema.optional(),
    revision: NanoDocumentCollaborationRevisionSchema.optional(),
}).strict();
export type NanoDocumentChangeScope = 'text' | 'table-cell' | 'block' | 'blocks' | 'document';
export interface NanoDocumentCollaborationChange {
    kind: 'nano-document.collaboration-change';
    change: NanoDocumentChange;
    peerId?: string;
    revision?: number | string;
}
export interface ApplyRemoteNanoDocumentChangeOptions {
    origin?: string;
    restoreRemoteSelection?: boolean;
}
export interface ReceiveNanoDocumentCollaborationChangeOptions extends ApplyRemoteNanoDocumentChangeOptions {
    ignoreOwnChanges?: boolean;
    localPeerId?: string;
}
export type NanoDocumentCollaborationCommitResult = ReturnType<NanoDocumentEngine['commit']>;
export type NanoDocumentTouchedPointer = Pointer;
export function parseNanoDocumentCollaborationChange(payload: unknown): NanoDocumentCollaborationChange | null {
    const result = NanoDocumentCollaborationChangeSchema.safeParse(payload);
    if (!result.success)
        return null;
    const change = parseNanoDocumentChange(result.data.change);
    if (!change)
        return null;
    return {
        kind: result.data.kind,
        change,
        ...(result.data.peerId === undefined ? {} : { peerId: result.data.peerId }),
        ...(result.data.revision === undefined ? {} : { revision: result.data.revision }),
    };
}
export function isNanoDocumentCollaborationChange(payload: unknown): payload is NanoDocumentCollaborationChange {
    return parseNanoDocumentCollaborationChange(payload) !== null;
}
export function createNanoDocumentCollaborationChange(change: NanoDocumentChange, options: {
    peerId?: string;
    revision?: number | string;
} = {}): NanoDocumentCollaborationChange {
    assertNanoDocumentCollaborationPeerId(options.peerId);
    assertNanoDocumentCollaborationRevision(options.revision);
    return {
        kind: 'nano-document.collaboration-change',
        change,
        ...(options.peerId === undefined ? {} : { peerId: options.peerId }),
        ...(options.revision === undefined ? {} : { revision: options.revision }),
    };
}
function assertNanoDocumentCollaborationPeerId(peerId) {
    if (peerId === undefined)
        return;
    if (NanoDocumentNonBlankStringSchema.safeParse(peerId).success)
        return;
    throw new Error('Nano Document collaboration peer id must not be blank');
}
function assertNanoDocumentCollaborationRevision(revision) {
    if (revision === undefined)
        return;
    if (NanoDocumentCollaborationRevisionSchema.safeParse(revision).success)
        return;
    throw new Error('Nano Document collaboration revision must be a nonnegative integer or non-blank string');
}
export function isOwnNanoDocumentCollaborationChange(
    message: NanoDocumentCollaborationChange,
    localPeerId: string | null | undefined,
): boolean {
    return typeof localPeerId === 'string' && localPeerId.length > 0 && message.peerId === localPeerId;
}
export function shouldReceiveNanoDocumentCollaborationChange(message: NanoDocumentCollaborationChange, options: {
    ignoreOwnChanges?: boolean;
    localPeerId?: string;
} = {}): boolean {
    return !(options.ignoreOwnChanges ?? true) || !isOwnNanoDocumentCollaborationChange(message, options.localPeerId);
}
export function receiveNanoDocumentCollaborationChange(
    engine: NanoDocumentEngine,
    message: NanoDocumentCollaborationChange,
    options: ReceiveNanoDocumentCollaborationChangeOptions = {},
): ReturnType<NanoDocumentEngine['commit']> {
    if (!shouldReceiveNanoDocumentCollaborationChange(message, options))
        return { ok: true };
    return applyRemoteNanoDocumentChange(engine, message.change, {
        ...options,
        origin: options.origin ?? remoteNanoDocumentChangeOrigin(message.peerId ?? message.change.origin),
    });
}
export function applyRemoteNanoDocumentChange(
    engine: NanoDocumentEngine,
    change: NanoDocumentChange,
    options: ApplyRemoteNanoDocumentChangeOptions = {},
): ReturnType<NanoDocumentEngine['commit']> {
    const remoteChange = createNanoDocumentChange({
        label: change.label,
        mergePath: change.mergePath ?? null,
        operations: change.operations,
        origin: options.origin ?? remoteNanoDocumentChangeOrigin(change.origin),
        selection: options.restoreRemoteSelection ? change.selection ?? null : null,
    });
    return commitNanoDocumentChange(engine, remoteChange);
}
export function remoteNanoDocumentChangeOrigin(origin: string): string {
    if (!NanoDocumentNonBlankStringSchema.safeParse(origin).success) {
        throw new Error('Nano Document remote change origin must not be blank');
    }
    return origin.startsWith('remote:') ? origin : `remote:${origin}`;
}
export function nanoDocumentCollaborationDeliveryKey(message: NanoDocumentCollaborationChange): string | null {
    if (!message.peerId || message.revision === undefined)
        return null;
    return `${message.peerId}\u0000${typeof message.revision}:${message.revision}`;
}
export function nanoDocumentCollaborationNumericRevision(message: NanoDocumentCollaborationChange): number | null {
    return typeof message.revision === 'number' ? message.revision : null;
}
export function nanoDocumentChangeTouchedPointers(change: NanoDocumentChange): Pointer[] {
    const pointers = new Set();
    for (const operation of change.operations) {
        pointers.add(operation.path);
        if (operation.op === 'move' || operation.op === 'copy')
            pointers.add(operation.from);
    }
    return [...pointers];
}
export function nanoDocumentChangeTouchesPointer(change: NanoDocumentChange, pointer: Pointer): boolean {
    return nanoDocumentChangeTouchedPointers(change).some((touchedPointer) => (pointersOverlap(touchedPointer, pointer)));
}
export function nanoDocumentChangeConflictPointers(
    remoteChange: NanoDocumentChange,
    pendingLocalChanges: readonly NanoDocumentChange[],
): Pointer[] {
    return nanoDocumentChangeTouchedPointers(remoteChange).filter((pointer) => (pendingLocalChanges.some((localChange) => nanoDocumentChangeTouchesPointer(localChange, pointer))));
}
export function nanoDocumentChangeScope(change: NanoDocumentChange): NanoDocumentChangeScope {
    if (change.operations.length !== 1)
        return 'document';
    const operation = change.operations[0];
    if (!operation)
        return 'document';
    if (operation.path === '/blocks')
        return 'blocks';
    if (/^\/blocks\/\d+\/text$/.test(operation.path))
        return 'text';
    if (/^\/blocks\/\d+\/rows\/\d+\/\d+$/.test(operation.path))
        return 'table-cell';
    if (/^\/blocks\/\d+$/.test(operation.path))
        return 'block';
    return 'document';
}
function pointersOverlap(left, right) {
    return left === right || pointerContains(left, right) || pointerContains(right, left);
}
function pointerContains(parent, child) {
    return parent === '' || child.startsWith(`${parent}/`);
}
