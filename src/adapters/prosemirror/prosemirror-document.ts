// @ts-nocheck
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { NanoDocumentChange } from '../../entities/document/nano-document-change.js';
import type { NanoBlock, NanoDocument } from '../../entities/document/nano-document-model.js';
import { nanoDocumentChangeFromDocuments, textMergePathForDocuments, } from '../../entities/document/nano-document-change.js';
import { NanoDocumentSchema } from '../../entities/document/nano-document-model.js';
import { replaceBlocksPatch, } from '../../entities/document/nano-document-selection.js';
import { nanoNodeNames } from './prosemirror-names.js';
import { nanoSchema } from './prosemirror-schema.js';
import { createBlockId, nanoBlockFromProseMirrorNode, prosemirrorNodeFromNanoBlock, } from './prosemirror-block-codecs.js';
export function prosemirrorDocFromNano(document: NanoDocument): ProseMirrorNode {
    const validDocument = NanoDocumentSchema.parse(document);
    return nanoSchema.nodes[nanoNodeNames.doc].create(null, validDocument.blocks.map(prosemirrorNodeFromNanoBlock));
}
export function nanoBlocksFromProseMirror(doc: ProseMirrorNode): NanoBlock[] {
    return nanoDocumentFromProseMirror(doc).blocks;
}
export function nanoDocumentFromProseMirror(doc: ProseMirrorNode): NanoDocument {
    const blocks = [];
    const usedIds = new Set();
    doc.forEach((node, _offset, index) => {
        blocks.push(nanoBlockFromProseMirrorNode(node, index, usedIds));
    });
    return NanoDocumentSchema.parse({
        blocks: blocks.length > 0 ? blocks : [{ id: createBlockId(0), type: 'paragraph', text: '', marks: [] }],
    });
}
export function nanoPatchFromDocuments(previous: NanoDocument, nextDoc: ProseMirrorNode) {
    return replaceBlocksPatch(previous, nanoDocumentFromProseMirror(nextDoc).blocks);
}
export function nanoDocumentChangeFromProseMirrorDoc(
    previous: NanoDocument,
    nextDoc: ProseMirrorNode,
    options: {
        label: string;
        origin?: string;
        selection?: unknown;
    },
): NanoDocumentChange | null {
    return nanoDocumentChangeFromDocuments(previous, nanoDocumentFromProseMirror(nextDoc), {
        label: options.label,
        origin: options.origin ?? 'prosemirror-view',
        selection: options.selection ?? null,
    });
}
export { textMergePathForDocuments };
