import type { NanoMark } from '../document/nano-document-model.js';

export type NanoMarkWithoutRange = NanoMark extends infer Mark
    ? Mark extends unknown
        ? Omit<Mark, 'from' | 'to'>
        : never
    : never;

export function nanoMarkWithRange(mark: NanoMarkWithoutRange, from: number, to: number): NanoMark {
    switch (mark.type) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strike':
        case 'highlight':
        case 'code':
        case 'tag':
        case 'mention':
        case 'note_link':
        case 'math':
        case 'footnote_ref':
        case 'link':
        case 'source':
            return { ...mark, from, to };
    }
}
