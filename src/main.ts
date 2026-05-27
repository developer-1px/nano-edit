import './styles/demo-host.css'
import './style.css'
import {
  demoDocumentById,
  demoDocuments,
  validDemoDocumentId,
} from './demo/document-library'
import {
  createPersistedDemoNanoDocument,
  type PersistedDemoNanoDocument,
} from './demo/persisted-document'
import {
  createNanoView,
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
let activePersistedDocument: PersistedDemoNanoDocument | null = null
let activeNanoView: NanoViewHandle | null = null

for (const demoDocument of demoDocuments) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'demo-document-button'
  button.dataset.documentId = demoDocument.id

  const title = document.createElement('span')
  title.className = 'demo-document-title'
  title.textContent = demoDocument.title

  const summary = document.createElement('span')
  summary.className = 'demo-document-summary'
  summary.textContent = demoDocument.summary

  button.append(title, summary)
  button.addEventListener('click', () => selectDemoDocument(demoDocument.id))
  documentList.append(button)
}

selectDemoDocument(storedActiveDemoDocumentId())

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeNanoView?.destroy()
    activePersistedDocument?.destroy()
  })
}

function selectDemoDocument(id: string): void {
  const nextDocument = demoDocumentById(id)
  if (activeDocumentId === nextDocument.id) return

  activeNanoView?.destroy()
  activePersistedDocument?.destroy()

  activeDocumentId = nextDocument.id
  storeActiveDemoDocumentId(nextDocument.id)
  syncDocumentNav()

  activePersistedDocument = createPersistedDemoNanoDocument({
    initialDocument: nextDocument.document,
    storageKey: nextDocument.storageKey,
  })
  activeNanoView = createNanoView({
    mount: editorMount,
    engine: activePersistedDocument.engine,
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
