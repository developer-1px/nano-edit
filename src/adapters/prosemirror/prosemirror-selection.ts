// @ts-nocheck
import {} from 'prosemirror-model';
import { Selection, TextSelection } from 'prosemirror-state';
import { blockTextPointer, point, pointOffset, pointPath, selectionSnap, } from '../../entities/document/nano-document-selection.js';
export function nanoSelectionFromProseMirror(doc, selection) {
    const anchor = nanoPointFromProseMirrorPosition(doc, selection.anchor);
    const focus = nanoPointFromProseMirrorPosition(doc, selection.head);
    return anchor && focus ? selectionSnap(anchor, focus) : null;
}
export function prosemirrorSelectionFromNano(doc, selection) {
    const range = selection?.selectionRanges[selection.primaryIndex];
    if (!range)
        return TextSelection.create(doc, firstTextPosition(doc));
    const anchor = prosemirrorPositionFromNanoPoint(doc, range.anchor);
    const focus = prosemirrorPositionFromNanoPoint(doc, range.focus);
    return TextSelection.create(doc, anchor, focus);
}
function nanoPointFromProseMirrorPosition(doc, position) {
    if (doc.childCount === 0)
        return null;
    const target = clamp(position, 0, doc.content.size);
    let blockStart = 0;
    for (let index = 0; index < doc.childCount; index += 1) {
        const block = doc.child(index);
        const textLength = block.textContent.length;
        const contentStart = blockStart + 1;
        const contentEnd = contentStart + textLength;
        if (target <= contentEnd || index === doc.childCount - 1) {
            return point(blockTextPointer(index), clamp(target - contentStart, 0, textLength));
        }
        blockStart += block.nodeSize;
    }
    return null;
}
function prosemirrorPositionFromNanoPoint(doc, value) {
    const match = /^\/blocks\/(\d+)\/text$/.exec(pointPath(value));
    if (!match || doc.childCount === 0)
        return firstTextPosition(doc);
    const blockIndex = clamp(Number(match[1]), 0, doc.childCount - 1);
    let blockStart = 0;
    for (let index = 0; index < blockIndex; index += 1) {
        blockStart += doc.child(index).nodeSize;
    }
    const block = doc.child(blockIndex);
    return blockStart + 1 + clamp(pointOffset(value), 0, block.textContent.length);
}
function firstTextPosition(doc) {
    let position = 0;
    for (let index = 0; index < doc.childCount; index += 1) {
        const block = doc.child(index);
        if (block.isTextblock)
            return position + 1;
        position += block.nodeSize;
    }
    return 0;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
