// @ts-nocheck
import type { NodeViewConstructor } from 'prosemirror-view';
import { customBlockFromProseMirrorNode } from '../../adapters/prosemirror/prosemirror-custom-block.js';
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names.js';
import { commitNanoDocumentChange, } from '../../entities/document/nano-document-change.js';
import { nanoDocumentChangeFromCommand, } from '../../entities/document/nano-document-command.js';
export function createNanoCustomBlockNodeViews(ctx): Record<string, NodeViewConstructor> {
    return ctx.customBlocks.length === 0
        ? {}
        : {
            [nanoNodeNames.customBlock]: (node) => createNanoCustomBlockNodeView(node, ctx),
        };
}
function createNanoCustomBlockNodeView(node, ctx) {
    let currentNode = node;
    let cleanupCallbacks = [];
    const dom = document.createElement('section');
    const render = () => {
        runCleanupCallbacks(cleanupCallbacks);
        cleanupCallbacks = [];
        const block = customBlockFromProseMirrorNode(currentNode, customBlockId(currentNode));
        const descriptor = descriptorForCustomBlock(block, ctx.customBlocks);
        const context = {
            id: block.id,
            onDestroy: (cleanup) => {
                cleanupCallbacks.push(cleanup);
            },
            replaceBlock: (nextBlock, options) => replaceCustomBlock(ctx, block.id, nextBlock, options),
            readonly: true,
            type: block.type,
        };
        dom.replaceChildren();
        dom.className = 'nano-block nano-custom-block';
        dom.contentEditable = 'false';
        dom.dataset.id = block.id;
        dom.dataset.customBlockType = block.type;
        if (descriptor) {
            dom.append(descriptor.render(block, context));
        }
        else {
            const title = document.createElement('span');
            title.className = 'nano-custom-block-title';
            title.textContent = block.type;
            const text = document.createElement('span');
            text.className = 'nano-custom-block-text';
            text.textContent = block.text ?? '';
            dom.append(title, text);
        }
    };
    render();
    return {
        dom,
        ignoreMutation: () => true,
        update(nextNode) {
            if (nextNode.type.name !== nanoNodeNames.customBlock)
                return false;
            currentNode = nextNode;
            render();
            return true;
        },
        destroy() {
            runCleanupCallbacks(cleanupCallbacks);
            cleanupCallbacks = [];
            dom.replaceChildren();
        },
    };
}
function replaceCustomBlock(ctx, blockId, block, options = {}) {
    const result = nanoDocumentChangeFromCommand(ctx.engine.value, {
        block,
        kind: 'nano-document.command.replace-block',
        label: options.label ?? 'replace custom block',
        origin: options.origin ?? 'nano-custom-block',
        selection: options.selection ?? null,
        target: { blockId },
    });
    if (!result.ok)
        return result;
    if (!result.change)
        return { ok: true };
    const committed = commitNanoDocumentChange(ctx.engine, result.change);
    if (committed.ok)
        ctx.onLocalChange(result.change);
    return committed;
}
function runCleanupCallbacks(callbacks) {
    for (const cleanup of callbacks) {
        cleanup();
    }
}
function descriptorForCustomBlock(block, descriptors) {
    return descriptors.find((descriptor) => (descriptor.type === block.type
        && (!descriptor.validateBlock || descriptor.validateBlock(block)))) ?? null;
}
function customBlockId(node) {
    return typeof node.attrs.id === 'string' && node.attrs.id
        ? node.attrs.id
        : 'custom-block';
}
