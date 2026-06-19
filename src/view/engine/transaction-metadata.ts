import type { Transaction } from 'prosemirror-state';

const nanoDocumentChangeTransactionMetadataKey = 'nano-edit:nano-document-change-metadata';
export interface NanoDocumentChangeTransactionMetadata {
    label?: string;
    origin?: string;
}

export function setNanoDocumentChangeTransactionMetadata(
    transaction: Transaction,
    metadata: NanoDocumentChangeTransactionMetadata,
): Transaction {
    const normalized = normalizeNanoDocumentChangeTransactionMetadata(metadata);
    return normalized ? transaction.setMeta(nanoDocumentChangeTransactionMetadataKey, normalized) : transaction;
}
export function nanoDocumentChangeTransactionMetadata(transaction: Transaction): NanoDocumentChangeTransactionMetadata | null {
    const metadata = transaction.getMeta(nanoDocumentChangeTransactionMetadataKey);
    if (!metadata || typeof metadata !== 'object')
        return null;
    return normalizeNanoDocumentChangeTransactionMetadata(metadata);
}
function normalizeNanoDocumentChangeTransactionMetadata(
    metadata: NanoDocumentChangeTransactionMetadata,
): NanoDocumentChangeTransactionMetadata | null {
    const label = nonBlankText(metadata.label);
    const origin = nonBlankText(metadata.origin);
    return label || origin ? { ...(label ? { label } : {}), ...(origin ? { origin } : {}) } : null;
}
function nonBlankText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
