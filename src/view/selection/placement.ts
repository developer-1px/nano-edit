// @ts-nocheck
import { Fragment } from 'prosemirror-model';
import { EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
export function movedBlockSelection(state, doc, block, nextFrom) {
    if (!block.node.isTextblock)
        return NodeSelection.create(doc, nextFrom);
    const offset = clampSelectionOffset(state.selection.from - block.from, block.node.nodeSize);
    return TextSelection.create(doc, nextFrom + offset);
}
export function selectionAfterInsertedContent(doc, from, content) {
    const textPosition = firstTextPositionInInsertedContent(from, content);
    if (textPosition !== null)
        return TextSelection.create(doc, textPosition);
    return NodeSelection.create(doc, Math.min(from, doc.content.size));
}
export function selectionAfterReplacementContent(doc, from, content, selectionOffset) {
    if (!(content instanceof Fragment) && content.isTextblock) {
        return TextSelection.create(doc, Math.min(from + 1 + selectionOffset, doc.content.size));
    }
    return selectionAfterInsertedContent(doc, from, content);
}
function clampSelectionOffset(offset, nodeSize) {
    return Math.max(1, Math.min(offset, nodeSize - 1));
}
function firstTextPositionInInsertedContent(from, content) {
    if (!(content instanceof Fragment))
        return content.isTextblock ? from + 1 : null;
    let position = null;
    let offset = 0;
    content.forEach((node) => {
        if (position === null && node.isTextblock)
            position = from + offset + 1;
        offset += node.nodeSize;
    });
    return position;
}
