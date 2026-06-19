// @ts-nocheck
import type { NanoDocumentEngine } from '../../entities/document/nano-document.js';
import type { NanoDocumentChange } from '../../entities/document/nano-document-change.js';
import type { NanoDocumentCollaborationChange, ReceiveNanoDocumentCollaborationChangeOptions } from '../../entities/document/nano-document-collaboration.js';
import { createNanoDocumentCollaborationChange, nanoDocumentCollaborationDeliveryKey, parseNanoDocumentCollaborationChange, receiveNanoDocumentCollaborationChange, shouldReceiveNanoDocumentCollaborationChange, } from '../../entities/document/nano-document-collaboration.js';
export interface NanoDocumentInMemoryCollaborationPeer {
    readonly peerId: string;
    disconnect: () => void;
    publish: (change: NanoDocumentChange, options?: {
        revision?: number | string;
    }) => NanoDocumentInMemoryCollaborationDispatch;
    receive: (payload: unknown, options?: ReceiveNanoDocumentCollaborationChangeOptions) => ReturnType<NanoDocumentEngine['commit']>;
}
export interface NanoDocumentInMemoryCollaborationDispatch {
    message: NanoDocumentCollaborationChange;
    results: readonly NanoDocumentInMemoryCollaborationPeerResult[];
}
export interface NanoDocumentInMemoryCollaborationPeerResult {
    peerId: string;
    result: ReturnType<NanoDocumentEngine['commit']>;
}
export interface NanoDocumentInMemoryCollaborationHub {
    connect: (options: {
        engine: NanoDocumentEngine;
        peerId: string;
        restoreRemoteSelection?: boolean;
    }) => NanoDocumentInMemoryCollaborationPeer;
    peerIds: () => string[];
}
export function createNanoDocumentInMemoryCollaborationHub(): NanoDocumentInMemoryCollaborationHub {
    const peers = new Map();
    const hub = {
        connect(options) {
            if (options.peerId.trim().length === 0) {
                throw new Error('Nano Document in-memory collaboration peer id must not be blank');
            }
            if (peers.has(options.peerId)) {
                throw new Error(`Nano Document in-memory collaboration peer already connected: ${options.peerId}`);
            }
            const receivedMessageKeys = new Set();
            const peer = {
                peerId: options.peerId,
                disconnect() {
                    if (peers.get(options.peerId) === peer)
                        peers.delete(options.peerId);
                },
                publish(change, publishOptions = {}) {
                    const message = createNanoDocumentCollaborationChange(change, {
                        peerId: options.peerId,
                        revision: publishOptions.revision,
                    });
                    const results = [...peers.values()].map((candidate) => ({
                        peerId: candidate.peerId,
                        result: candidate.receive(message),
                    }));
                    return { message, results };
                },
                receive(payload, receiveOptions = {}) {
                    const message = parseNanoDocumentCollaborationChange(payload);
                    if (!message) {
                        return {
                            ok: false,
                            code: 'schema_violation',
                            reason: 'invalid Nano Document collaboration change payload',
                        };
                    }
                    const messageKey = nanoDocumentCollaborationDeliveryKey(message);
                    const receiveChangeOptions = {
                        restoreRemoteSelection: options.restoreRemoteSelection,
                        ...receiveOptions,
                        localPeerId: receiveOptions.localPeerId ?? options.peerId,
                    };
                    if (!shouldReceiveNanoDocumentCollaborationChange(message, receiveChangeOptions))
                        return { ok: true };
                    if (messageKey && receivedMessageKeys.has(messageKey))
                        return { ok: true };
                    const result = receiveNanoDocumentCollaborationChange(options.engine, message, receiveChangeOptions);
                    if (result.ok && messageKey)
                        receivedMessageKeys.add(messageKey);
                    return result;
                },
            };
            peers.set(options.peerId, peer);
            return peer;
        },
        peerIds() {
            return [...peers.keys()];
        },
    };
    return hub;
}
