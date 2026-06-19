import type { NanoBlock } from '../../entities/document/nano-document-model.js';
import { checkedMarker } from '../../codecs/markdown/nano-markdown-marker-attrs.js';

type TodoBlock = Extract<NanoBlock, {
    type: 'todo';
}>;
export interface TodoIndexEntry {
    blockId: string;
    label: string;
    target?: string;
    blockIds?: readonly string[];
    detail?: string;
    checked: boolean;
    checkedMarker?: 'x' | 'X';
}

export function todoIndexEntryFromBlock(block: NanoBlock): TodoIndexEntry | null {
    if (block.type !== 'todo')
        return null;
    const entry: TodoIndexEntry = {
        blockId: block.id,
        label: block.text,
        checked: block.checked,
    };
    if (block.checked && block.checkedMarker === 'X')
        entry.checkedMarker = 'X';
    return entry;
}
export function todoIndexTextLabel(todo: TodoIndexEntry): string {
    return `${todo.checked ? `- [${checkedMarker(todo.checkedMarker)}]` : '- [ ]'} ${todo.label}`;
}
export function todoIndexBlockLabel(block: TodoBlock, plainTextPreview: (text: string) => string): string {
    return `- [${block.checked ? checkedMarker(block.checkedMarker) : ' '}] ${plainTextPreview(block.text)}`;
}
