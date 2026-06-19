import { Check, Sparkles } from 'lucide'
import { createNano2View } from '..'
import {
  nano2AgentAcceptProposal,
  nano2AgentReadDocument,
  nano2AgentRewriteBlockProposal,
  type Nano2AgentProposal,
} from '../ai-agent'
import { lucideIconElement } from '../../view/icons'
import type { NanoDocument } from '../../entities/document/nano-document-model'
import {
  createPersistedNano2ExampleDocument,
} from './persistence'
import type { Nano2ExampleSurfaceHandle } from './collaboration'

export function createNano2AIAgentExample(options: {
  document: NanoDocument
  mount: HTMLElement
  storageKey: string
}): Nano2ExampleSurfaceHandle {
  const root = document.createElement('section')
  root.className = 'nano2-ai-agent'
  root.dataset.status = 'idle'

  const controls = document.createElement('div')
  controls.className = 'nano2-ai-agent-controls'

  const status = document.createElement('div')
  status.className = 'nano2-ai-agent-status'

  const draftButton = agentButton('Draft proposal', Sparkles)
  draftButton.dataset.action = 'draft-proposal'

  const acceptButton = agentButton('Accept proposal', Check)
  acceptButton.dataset.action = 'accept-proposal'
  acceptButton.disabled = true

  const preview = document.createElement('div')
  preview.className = 'nano2-ai-agent-preview'

  const editorMount = document.createElement('div')
  editorMount.className = 'nano2-ai-agent-editor'

  controls.append(status, draftButton, acceptButton)
  root.append(controls, preview, editorMount)
  options.mount.replaceChildren(root)

  const persisted = createPersistedNano2ExampleDocument({
    initialDocument: options.document,
    storageKey: options.storageKey,
  })
  let proposal: Nano2AgentProposal | null = null

  const view = createNano2View({
    mount: editorMount,
    engine: persisted.engine,
    ariaLabel: 'Nano2 Tiptap AI Agent example',
  })

  draftButton.addEventListener('click', draftProposal)
  acceptButton.addEventListener('click', acceptProposal)
  renderStatus()

  return {
    destroy: () => {
      draftButton.removeEventListener('click', draftProposal)
      acceptButton.removeEventListener('click', acceptProposal)
      view.destroy()
      persisted.destroy()
      root.remove()
    },
  }

  function draftProposal(): void {
    const read = nano2AgentReadDocument(persisted.engine.value)
    proposal = nano2AgentRewriteBlockProposal(persisted.engine.value, {
      blockId: 'nano2-agent-target',
      prompt: `Tighten ${read.textBlockCount} text blocks`,
      text: 'Agent rewrite accepted through NanoDocumentChange.',
    })
    root.dataset.status = proposal ? 'proposal-ready' : 'idle'
    renderStatus()
  }

  function acceptProposal(): void {
    if (!proposal) return
    const result = nano2AgentAcceptProposal(persisted.engine, proposal)
    if (!result.ok) {
      root.dataset.status = 'blocked'
      renderStatus()
      return
    }
    proposal = null
    root.dataset.status = 'applied'
    renderStatus()
  }

  function renderStatus(): void {
    status.textContent = root.dataset.status ?? 'idle'
    acceptButton.disabled = !proposal
    preview.textContent = proposal?.summary ?? ''
  }
}

function agentButton(label: string, icon: Parameters<typeof lucideIconElement>[0]): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nano2-ai-agent-button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.append(lucideIconElement(icon, 'nano2-ai-agent-button-icon'))
  return button
}
