import type { IndexEntry } from '../indexing/document-index/types.js';

export type IndexEntryAction = 'tag' | 'note' | 'missing-note' | 'backlink' | 'external' | 'select';
export interface IndexSectionView {
    action: IndexEntryAction;
    entries: readonly IndexEntry[];
    title: string;
}

export function indexEntryBlockIds(entry: IndexEntry): readonly string[] {
    return entry.blockIds ?? [entry.blockId];
}
export function indexEntrySymbol(action: IndexEntryAction): string {
    switch (action) {
        case 'tag':
            return 'tag';
        case 'note':
            return 'note';
        case 'missing-note':
            return '+';
        case 'backlink':
            return '<-';
        case 'external':
            return 'url';
        case 'select':
            return '•';
    }
}
