import {
  createNano2CollaborativeFieldEngines,
  createNano2CollaborativeFieldsHub,
  nano2CollaborativeFieldIds,
  type Nano2CollaborativeFieldEngines,
  type Nano2CollaborativeFieldId,
  type Nano2CollaborativeFieldsDocument,
  type Nano2CollaborativeFieldsPeer,
} from '../collaborative-fields'
import { createNano2View, type Nano2ViewHandle } from '..'
import type { NanoDocumentChange } from '../../entities/document/nano-document-change'
import type { Nano2ExampleSurfaceHandle } from './collaboration'

interface Nano2CollaborativeFieldsPeerSurface {
  engines: Nano2CollaborativeFieldEngines
  peer: Nano2CollaborativeFieldsPeer
  views: Nano2ViewHandle[]
}

const fieldLabels: Record<Nano2CollaborativeFieldId, string> = {
  notes: 'Notes',
  summary: 'Summary',
  tasks: 'Tasks',
}

export function createNano2CollaborativeFieldsExample(options: {
  document: Nano2CollaborativeFieldsDocument
  mount: HTMLElement
}): Nano2ExampleSurfaceHandle {
  const root = document.createElement('section')
  root.className = 'nano2-collaborative-fields'
  root.dataset.fields = nano2CollaborativeFieldIds.join(',')

  const status = document.createElement('div')
  status.className = 'nano2-collaborative-fields-status'
  status.textContent = 'peer-a, peer-b / summary, tasks, notes'

  const workspace = document.createElement('div')
  workspace.className = 'nano2-collaborative-fields-workspace'

  root.append(status, workspace)
  options.mount.replaceChildren(root)

  const hub = createNano2CollaborativeFieldsHub()
  const peers: Nano2CollaborativeFieldsPeerSurface[] = []
  let revision = 0

  addPeer('peer-a', 'Peer A')
  addPeer('peer-b', 'Peer B')

  return {
    destroy: () => {
      for (const peer of peers) {
        for (const view of peer.views) view.destroy()
        peer.peer.disconnect()
      }
      root.remove()
    },
  }

  function addPeer(peerId: string, label: string): void {
    const engines = createNano2CollaborativeFieldEngines(options.document)
    const peer = hub.connect({ fields: engines, peerId })
    const panel = document.createElement('section')
    panel.className = 'nano2-collaborative-fields-peer'
    panel.dataset.peerId = peerId

    const title = document.createElement('h2')
    title.className = 'nano2-collaborative-fields-peer-title'
    title.textContent = label
    panel.append(title)

    const views = nano2CollaborativeFieldIds.map((fieldId) => {
      const field = document.createElement('section')
      field.className = 'nano2-collaborative-field'
      field.dataset.fieldId = fieldId
      field.dataset.peerId = peerId

      const header = document.createElement('header')
      header.className = 'nano2-collaborative-field-header'

      const fieldTitle = document.createElement('h3')
      fieldTitle.className = 'nano2-collaborative-field-title'
      fieldTitle.textContent = fieldLabels[fieldId]

      const fieldState = document.createElement('span')
      fieldState.className = 'nano2-collaborative-field-state'
      fieldState.textContent = 'synced'

      const mount = document.createElement('div')
      mount.className = 'nano2-collaborative-field-editor'

      header.append(fieldTitle, fieldState)
      field.append(header, mount)
      panel.append(field)

      return createNano2View({
        mount,
        engine: engines[fieldId],
        ariaLabel: `Nano2 Collaborative Fields ${label} ${fieldLabels[fieldId]}`,
        onLocalChange: (change) => {
          const dispatch = publishFieldChange(peer, fieldId, change)
          fieldState.textContent = dispatch.results.every((entry) => entry.result.ok) ? 'synced' : 'blocked'
        },
      })
    })

    workspace.append(panel)
    peers.push({ engines, peer, views })
    syncStatus()
  }

  function publishFieldChange(
    peer: Nano2CollaborativeFieldsPeer,
    fieldId: Nano2CollaborativeFieldId,
    change: NanoDocumentChange,
  ) {
    revision += 1
    const dispatch = peer.publish(fieldId, change, { revision })
    root.dataset.revision = String(revision)
    return dispatch
  }

  function syncStatus(): void {
    root.dataset.peers = hub.peerIds().join(',')
    status.textContent = `${hub.peerIds().join(', ')} / ${hub.fieldIds().join(', ')}`
  }
}
