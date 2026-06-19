// @ts-nocheck
import { DOMSerializer, } from 'prosemirror-model';
import type { NodeViewConstructor } from 'prosemirror-view';
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names.js';
import { tableDomSpec } from '../../adapters/prosemirror/prosemirror-table-dom.js';
export function createNanoTableNodeViews(): Record<string, NodeViewConstructor> {
    return {
        [nanoNodeNames.table]: (node) => createNanoTableNodeView(node),
    };
}
function createNanoTableNodeView(node) {
    let currentNode = node;
    const dom = tableDomFromNode(currentNode);
    return {
        dom,
        ignoreMutation: () => true,
        update(nextNode) {
            if (nextNode.type.name !== nanoNodeNames.table)
                return false;
            currentNode = nextNode;
            syncElement(dom, tableDomFromNode(currentNode));
            return true;
        },
        destroy() {
            dom.replaceChildren();
        },
    };
}
function tableDomFromNode(node) {
    const rendered = DOMSerializer.renderSpec(document, tableDomSpec(node.attrs.id, node.attrs.rows, node.attrs.align, node.attrs.separatorCells, node.attrs.leadingPipe, node.attrs.trailingPipe, node.attrs.leadingPipes, node.attrs.trailingPipes));
    if (!(rendered.dom instanceof HTMLElement)) {
        throw new Error('Nano table node view expected an HTMLElement root');
    }
    return rendered.dom;
}
function syncElement(target, source) {
    for (const attribute of [...target.attributes]) {
        target.removeAttribute(attribute.name);
    }
    for (const attribute of [...source.attributes]) {
        target.setAttribute(attribute.name, attribute.value);
    }
    target.replaceChildren(...source.childNodes);
}
