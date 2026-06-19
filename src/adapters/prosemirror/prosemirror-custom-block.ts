// @ts-nocheck
import type { DOMOutputSpec, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';
import { NanoCustomBlockSchema, } from '../../entities/block/schema/nano-block-schema.js';
import { nanoNodeNames } from './prosemirror-names.js';
import { prosemirrorParseDomElement } from './prosemirror-parse-dom.js';
export const customBlockNodeSpec: NodeSpec = {
    group: 'block',
    atom: true,
    selectable: true,
    attrs: {
        id: { default: null },
        customType: { default: 'custom.block' },
        text: { default: null },
        marks: { default: null },
        data: { default: null },
    },
    parseDOM: [{
            tag: 'section.nano-custom-block',
            getAttrs: (dom) => {
                const element = prosemirrorParseDomElement(dom);
                if (!element)
                    return false;
                return {
                    customType: element.dataset.customBlockType ?? 'custom.block',
                    data: jsonAttribute(element.dataset.customBlockData),
                    marks: jsonAttribute(element.dataset.customBlockMarks),
                    text: element.dataset.customBlockText ?? element.textContent ?? '',
                };
            },
        }],
    toDOM: (node: ProseMirrorNode): DOMOutputSpec => {
        const text = typeof node.attrs.text === 'string' ? node.attrs.text : '';
        const customType = typeof node.attrs.customType === 'string' ? node.attrs.customType : 'custom.block';
        return [
            'section',
            {
                class: 'nano-block nano-custom-block',
                contenteditable: 'false',
                'data-id': node.attrs.id,
                'data-custom-block-type': customType,
                'data-custom-block-text': text,
                ...(node.attrs.data ? { 'data-custom-block-data': JSON.stringify(node.attrs.data) } : {}),
                ...(node.attrs.marks ? { 'data-custom-block-marks': JSON.stringify(node.attrs.marks) } : {}),
            },
            ['span', { class: 'nano-custom-block-title' }, customType],
            ['span', { class: 'nano-custom-block-text' }, text],
        ];
    },
};
export function customBlockNodeAttrsFromBlock(block) {
    return {
        id: block.id,
        customType: block.type,
        text: block.text ?? null,
        marks: block.marks ?? null,
        data: block.data ?? null,
    };
}
export function customBlockFromProseMirrorNode(node, id) {
    return NanoCustomBlockSchema.parse({
        id,
        type: typeof node.attrs.customType === 'string' ? node.attrs.customType : 'custom.block',
        ...(typeof node.attrs.text === 'string' ? { text: node.attrs.text } : {}),
        ...(Array.isArray(node.attrs.marks) ? { marks: node.attrs.marks } : {}),
        ...(isRecord(node.attrs.data) ? { data: node.attrs.data } : {}),
    });
}
export function isCustomBlockNode(node) {
    return node.type.name === nanoNodeNames.customBlock;
}
function jsonAttribute(value) {
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
