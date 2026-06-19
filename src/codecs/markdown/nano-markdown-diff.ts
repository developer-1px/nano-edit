// @ts-nocheck
import type { NanoMarkdownBlockEntry } from './nano-markdown-serialize.js';
import { nanoDocumentFromMarkdown } from './nano-markdown-parse.js';
import { nanoMarkdownBlocksFromDocument, } from './nano-markdown-serialize.js';
export type NanoMarkdownBlockDiffIdentity = 'markdown-lcs-position';
export interface NanoMarkdownBlockPair {
    readonly after: NanoMarkdownBlockEntry;
    readonly before: NanoMarkdownBlockEntry;
}
export interface NanoMarkdownBlockDiff {
    readonly added: readonly NanoMarkdownBlockEntry[];
    readonly edited: readonly NanoMarkdownBlockPair[];
    readonly identity: NanoMarkdownBlockDiffIdentity;
    readonly removed: readonly NanoMarkdownBlockEntry[];
    readonly unchanged: readonly NanoMarkdownBlockPair[];
}
export function nanoMarkdownBlockDiff(beforeMarkdown: string, afterMarkdown: string): NanoMarkdownBlockDiff {
    return nanoMarkdownBlockDiffEntries(nanoMarkdownBlocksFromDocument(nanoDocumentFromMarkdown(beforeMarkdown)), nanoMarkdownBlocksFromDocument(nanoDocumentFromMarkdown(afterMarkdown)));
}
export function nanoMarkdownBlockDiffEntries(
    before: readonly NanoMarkdownBlockEntry[],
    after: readonly NanoMarkdownBlockEntry[],
): NanoMarkdownBlockDiff {
    const added = [];
    const edited = [];
    const removed = [];
    const unchanged = [];
    const anchors = commonMarkdownAnchors(before, after);
    let beforeCursor = 0;
    let afterCursor = 0;
    for (const anchor of anchors) {
        appendChangedSegment({
            added,
            after,
            afterEnd: anchor.afterIndex,
            afterStart: afterCursor,
            before,
            beforeEnd: anchor.beforeIndex,
            beforeStart: beforeCursor,
            edited,
            removed,
            unchanged,
        });
        unchanged.push({
            after: after[anchor.afterIndex],
            before: before[anchor.beforeIndex],
        });
        beforeCursor = anchor.beforeIndex + 1;
        afterCursor = anchor.afterIndex + 1;
    }
    appendChangedSegment({
        added,
        after,
        afterEnd: after.length,
        afterStart: afterCursor,
        before,
        beforeEnd: before.length,
        beforeStart: beforeCursor,
        edited,
        removed,
        unchanged,
    });
    return {
        added,
        edited,
        identity: 'markdown-lcs-position',
        removed,
        unchanged,
    };
}
function commonMarkdownAnchors(before, after) {
    const lengths = Array.from({ length: before.length + 1 }, () => (Array.from({ length: after.length + 1 }, () => 0)));
    for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
        for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex -= 1) {
            lengths[beforeIndex][afterIndex] = before[beforeIndex].markdown === after[afterIndex].markdown
                ? lengths[beforeIndex + 1][afterIndex + 1] + 1
                : Math.max(lengths[beforeIndex + 1][afterIndex], lengths[beforeIndex][afterIndex + 1]);
        }
    }
    const anchors = [];
    let beforeIndex = 0;
    let afterIndex = 0;
    while (beforeIndex < before.length && afterIndex < after.length) {
        if (before[beforeIndex].markdown === after[afterIndex].markdown) {
            anchors.push({ afterIndex, beforeIndex });
            beforeIndex += 1;
            afterIndex += 1;
        }
        else if (lengths[beforeIndex + 1][afterIndex] >= lengths[beforeIndex][afterIndex + 1]) {
            beforeIndex += 1;
        }
        else {
            afterIndex += 1;
        }
    }
    return anchors;
}
function appendChangedSegment(options) {
    const beforeSegment = options.before.slice(options.beforeStart, options.beforeEnd);
    const afterSegment = options.after.slice(options.afterStart, options.afterEnd);
    const pairedLength = Math.min(beforeSegment.length, afterSegment.length);
    for (let index = 0; index < pairedLength; index += 1) {
        const before = beforeSegment[index];
        const after = afterSegment[index];
        if (before.markdown === after.markdown)
            options.unchanged.push({ before, after });
        else
            options.edited.push({ before, after });
    }
    options.removed.push(...beforeSegment.slice(pairedLength));
    options.added.push(...afterSegment.slice(pairedLength));
}
