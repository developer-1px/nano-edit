import './styles/demo-host.css'
import './style.css'
import {
  demoArtifactById,
  demoArtifacts,
  validDemoDocumentId,
} from './demo/document-library'
import {
  createInlineEditDemo,
  type InlineEditDemoHandle,
} from './demo/inline-edit-demo'
import {
  createMentionComposerDemo,
  type MentionComposerDemoHandle,
} from './demo/mention-composer-demo'
import {
  createPersistedDemoNanoDeck,
  type PersistedDemoNanoDeck,
} from './demo/persisted-deck'
import {
  createPersistedDemoNanoDocument,
  type PersistedDemoNanoDocument,
} from './demo/persisted-document'
import {
  createNanoDeckView,
  createNanoView,
  type NanoDeckViewHandle,
  type NanoViewHandle,
} from './view/nano-view'

const ACTIVE_DEMO_DOCUMENT_STORAGE_KEY = 'nano-edit:active-demo-document:v1'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app')
}

const demoShell = document.createElement('div')
demoShell.className = 'demo-documents'

const documentNav = document.createElement('aside')
documentNav.className = 'demo-document-nav'
documentNav.ariaLabel = 'Documents'

const documentNavTitle = document.createElement('div')
documentNavTitle.className = 'demo-document-nav-title'
documentNavTitle.textContent = 'Documents'

const documentList = document.createElement('div')
documentList.className = 'demo-document-list'

const documentMain = document.createElement('main')
documentMain.className = 'demo-document-main'

const editorMount = document.createElement('div')
editorMount.className = 'demo-editor-mount'

documentNav.append(documentNavTitle, documentList)
documentMain.append(editorMount)
demoShell.append(documentNav, documentMain)
app.replaceChildren(demoShell)

let activeDocumentId: string | null = null
let activePersistedArtifact: PersistedDemoNanoDocument | PersistedDemoNanoDeck | null = null
let activeNanoView: InlineEditDemoHandle | MentionComposerDemoHandle | NanoDeckViewHandle | NanoViewHandle | null = null

for (const demoArtifact of demoArtifacts) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'demo-document-button'
  button.dataset.documentId = demoArtifact.id
  button.dataset.kind = demoArtifact.kind

  const title = document.createElement('span')
  title.className = 'demo-document-title'
  title.textContent = demoArtifact.title

  const summary = document.createElement('span')
  summary.className = 'demo-document-summary'
  summary.textContent = demoArtifact.summary

  button.append(title, summary)
  button.addEventListener('click', () => selectDemoDocument(demoArtifact.id))
  documentList.append(button)
}

selectDemoDocument(storedActiveDemoDocumentId())

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeNanoView?.destroy()
    activePersistedArtifact?.destroy()
  })
}

function selectDemoDocument(id: string): void {
  const nextArtifact = demoArtifactById(id)
  if (activeDocumentId === nextArtifact.id) return

  activeNanoView?.destroy()
  activePersistedArtifact?.destroy()

  activeDocumentId = nextArtifact.id
  storeActiveDemoDocumentId(nextArtifact.id)
  syncDocumentNav()

  if (nextArtifact.kind === 'deck') {
    activePersistedArtifact = createPersistedDemoNanoDeck({
      initialDeck: nextArtifact.deck,
      storageKey: nextArtifact.storageKey,
    })
    activeNanoView = createNanoDeckView({
      mount: editorMount,
      engine: activePersistedArtifact.engine,
    })
    return
  }

  if (nextArtifact.kind === 'inline-edit') {
    activePersistedArtifact = null
    activeNanoView = createInlineEditDemo(editorMount)
    return
  }

  if (nextArtifact.kind === 'mention-composer') {
    activePersistedArtifact = null
    activeNanoView = createMentionComposerDemo(editorMount)
    return
  }

  activePersistedArtifact = createPersistedDemoNanoDocument({
    initialDocument: nextArtifact.document,
    storageKey: nextArtifact.storageKey,
  })
  activeNanoView = createNanoView({
    mount: editorMount,
    engine: activePersistedArtifact.engine,
  })
}

function syncDocumentNav(): void {
  for (const button of documentList.querySelectorAll<HTMLButtonElement>('.demo-document-button')) {
    const active = button.dataset.documentId === activeDocumentId
    button.dataset.active = String(active)
    if (active) button.setAttribute('aria-current', 'page')
    else button.removeAttribute('aria-current')
  }
}

function storedActiveDemoDocumentId(): string {
  if (typeof window === 'undefined') return validDemoDocumentId(null)

  try {
    return validDemoDocumentId(window.localStorage.getItem(ACTIVE_DEMO_DOCUMENT_STORAGE_KEY))
  } catch {
    return validDemoDocumentId(null)
  }
}

function storeActiveDemoDocumentId(id: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ACTIVE_DEMO_DOCUMENT_STORAGE_KEY, id)
  } catch {
    // Active document memory is best-effort.
  }
}
