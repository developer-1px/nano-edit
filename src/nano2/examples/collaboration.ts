import { createNanoDocument, type NanoDocumentEngine } from '../../entities/document/nano-document'
import type { NanoDocumentChange } from '../../entities/document/nano-document-change'
import type { NanoDocument } from '../../entities/document/nano-document-model'
import {
  createNanoDocumentInMemoryCollaborationHub,
  type NanoDocumentInMemoryCollaborationPeer,
} from '../../adapters/collaboration/nano-document-in-memory-collaboration'
import { createNano2View, type Nano2ViewHandle } from '..'

export interface Nano2ExampleSurfaceHandle {
  destroy(): void
}

interface Nano2CollaborationPeerSurface {
  disconnect(): void
  engine: NanoDocumentEngine
  id: string
  view: Nano2ViewHandle
}

export function createNano2CollaborationExample(options: {
  document: NanoDocument
  mount: HTMLElement
}): Nano2ExampleSurfaceHandle {
  const root = document.createElement('section')
  root.className = 'nano2-collaboration'

  const controls = document.createElement('div')
  controls.className = 'nano2-collaboration-controls'

  const status = document.createElement('div')
  status.className = 'nano2-collaboration-status'
  status.textContent = 'peer-a, peer-b'

  const join = document.createElement('button')
  join.className = 'nano2-collaboration-join'
  join.type = 'button'
  join.textContent = 'Join'
  join.dataset.action = 'join-peer'
  join.addEventListener('click', () => {
    if (peers.some((peer) => peer.id === 'peer-c')) return
    addPeer('peer-c', 'Peer C', peers[0]?.engine.value ?? options.document)
    join.disabled = true
  })

  const workspace = document.createElement('div')
  workspace.className = 'nano2-collaboration-workspace'

  controls.append(status, join)
  root.append(controls, workspace)
  options.mount.replaceChildren(root)

  const hub = createNanoDocumentInMemoryCollaborationHub()
  const peers: Nano2CollaborationPeerSurface[] = []
  let revision = 0

  addPeer('peer-a', 'Peer A', options.document)
  addPeer('peer-b', 'Peer B', options.document)

  return {
    destroy: () => {
      for (const peer of peers) {
        peer.view.destroy()
        peer.disconnect()
      }
      root.remove()
    },
  }

  function addPeer(id: string, label: string, documentValue: NanoDocument): void {
    const engine = createNanoDocument(cloneNanoDocument(documentValue))
    const peer = hub.connect({ engine, peerId: id })
    const panel = document.createElement('section')
    panel.className = 'nano2-collaboration-peer'
    panel.dataset.peerId = id

    const header = document.createElement('header')
    header.className = 'nano2-collaboration-peer-header'

    const title = document.createElement('h2')
    title.className = 'nano2-collaboration-peer-title'
    title.textContent = label

    const peerState = document.createElement('span')
    peerState.className = 'nano2-collaboration-peer-state'
    peerState.textContent = 'synced'

    const editorMount = document.createElement('div')
    editorMount.className = 'nano2-collaboration-editor'

    header.append(title, peerState)
    panel.append(header, editorMount)
    workspace.append(panel)

    const view = createNano2View({
      mount: editorMount,
      engine,
      ariaLabel: `Nano2 Collaboration ${label}`,
      onLocalChange: (change) => {
        const dispatch = publishPeerChange(peer, change)
        peerState.textContent = dispatch.results.every((entry) => entry.result.ok) ? 'synced' : 'blocked'
      },
    })
    peers.push({
      disconnect: peer.disconnect,
      engine,
      id,
      view,
    })
    syncStatus()
  }

  function publishPeerChange(peer: NanoDocumentInMemoryCollaborationPeer, change: NanoDocumentChange) {
    revision += 1
    const dispatch = peer.publish(change, { revision })
    root.dataset.revision = String(revision)
    return dispatch
  }

  function syncStatus(): void {
    const ids = hub.peerIds()
    root.dataset.peers = ids.join(',')
    status.textContent = ids.join(', ')
  }
}

function cloneNanoDocument(documentValue: NanoDocument): NanoDocument {
  return JSON.parse(JSON.stringify(documentValue)) as NanoDocument
}
