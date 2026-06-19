import './styles/demo-host.css'
import './styles/nano2.css'
import './style.css'
import {
  demoArtifactById,
  demoArtifacts,
  validDemoArtifactId,
} from './demo/artifact-library'
import {
  artifactIdFromPathname,
  demoArtifactHref,
  demoRouter,
} from './demo/demo-router'
import {
  createInlineEditDemo,
  type InlineEditDemoHandle,
} from './demo/inline-edit-demo'
import {
  createMentionComposerDemo,
  type MentionComposerDemoHandle,
} from './demo/mention-composer-demo'
import {
  createNano2Demo,
  type Nano2DemoHandle,
} from './demo/nano2-demo'
import {
  createTeamKnowledgePageReference,
  type TeamKnowledgePageReferenceHandle,
} from './reference-examples/team-knowledge-page'
import {
  createLaunchForecastGridReference,
  type LaunchForecastGridReferenceHandle,
} from './reference-examples/launch-forecast-grid'
import {
  createIssueTriageDeskReference,
  type IssueTriageDeskReferenceHandle,
} from './reference-examples/issue-triage-desk'
import {
  createMentionCommandInboxReference,
  type MentionCommandInboxReferenceHandle,
} from './reference-examples/mention-command-inbox'
import {
  createBoardDeckReviewReference,
  type BoardDeckReviewReferenceHandle,
} from './reference-examples/board-deck-review'
import {
  createCustomBlockAuditReportReference,
  type CustomBlockAuditReportReferenceHandle,
} from './reference-examples/custom-block-audit-report'
import {
  createCustomBlockRenewalPackReference,
  type CustomBlockRenewalPackReferenceHandle,
} from './reference-examples/custom-block-renewal-pack'
import {
  createReviewCollaborationRoomReference,
  type ReviewCollaborationRoomReferenceHandle,
} from './reference-examples/review-collaboration-room'
import {
  createReviewBackendSessionReference,
  type ReviewBackendSessionReferenceHandle,
} from './reference-examples/review-backend-session'
import {
  createResearchReportEditorReference,
  type ResearchReportEditorReferenceHandle,
} from './reference-examples/research-report-editor'
import {
  createStructuredTableReviewReference,
  type StructuredTableReviewReferenceHandle,
} from './reference-examples/structured-table-review'
import {
  createReviewWorkspaceReference,
  type ReviewWorkspaceReferenceHandle,
} from './reference-examples/review-workspace'
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
  type NanoDeckViewHandle,
} from './view/deck/deck-view'
import { createNanoView } from './view/runtime/create'
import type {
  NanoViewHandle,
} from './view/runtime/types'

const ACTIVE_DEMO_ARTIFACT_STORAGE_KEY = 'nano-edit:active-demo-document:v1'

const demoRoot = document.querySelector<HTMLDivElement>('#app')

if (!demoRoot) {
  throw new Error('Missing #app')
}

const demoShell = document.createElement('div')
demoShell.className = 'demo-artifacts'

const artifactNav = document.createElement('aside')
artifactNav.className = 'demo-artifact-nav'
artifactNav.ariaLabel = 'Artifacts'

const artifactNavTitle = document.createElement('div')
artifactNavTitle.className = 'demo-artifact-nav-title'
artifactNavTitle.textContent = 'Artifacts'

const artifactList = document.createElement('div')
artifactList.className = 'demo-artifact-list'

const artifactMain = document.createElement('main')
artifactMain.className = 'demo-artifact-main'

const editorMount = document.createElement('div')
editorMount.className = 'demo-editor-mount'

artifactNav.append(artifactNavTitle, artifactList)
artifactMain.append(editorMount)
demoShell.append(artifactNav, artifactMain)
demoRoot.replaceChildren(demoShell)

let activeArtifactId: string | null = null
let activePersistedArtifact: PersistedDemoNanoDocument | PersistedDemoNanoDeck | null = null
let activeNanoView: BoardDeckReviewReferenceHandle | CustomBlockAuditReportReferenceHandle | CustomBlockRenewalPackReferenceHandle | InlineEditDemoHandle | IssueTriageDeskReferenceHandle | LaunchForecastGridReferenceHandle | MentionCommandInboxReferenceHandle | MentionComposerDemoHandle | Nano2DemoHandle | NanoDeckViewHandle | NanoViewHandle | ResearchReportEditorReferenceHandle | ReviewBackendSessionReferenceHandle | ReviewCollaborationRoomReferenceHandle | ReviewWorkspaceReferenceHandle | StructuredTableReviewReferenceHandle | TeamKnowledgePageReferenceHandle | null = null

for (const demoArtifact of demoArtifacts) {
  const button = document.createElement('a')
  button.className = 'demo-artifact-button'
  button.href = demoArtifactHref(demoArtifact.id)
  button.dataset.artifactId = demoArtifact.id
  button.dataset.kind = demoArtifact.kind

  const title = document.createElement('span')
  title.className = 'demo-artifact-title'
  title.textContent = demoArtifact.title

  const summary = document.createElement('span')
  summary.className = 'demo-artifact-summary'
  summary.textContent = demoArtifact.summary

  button.append(title, summary)
  button.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (event.button !== 0) return
    event.preventDefault()
    void demoRouter.navigate({
      to: '/artifacts/$artifactId',
      params: { artifactId: demoArtifact.id },
    })
  })
  artifactList.append(button)
}

demoRouter.subscribe('onResolved', (event) => {
  selectDemoArtifact(routeArtifactId(event.toLocation.pathname))
})

if (artifactIdFromPathname(window.location.pathname) === null) {
  void demoRouter.navigate({
    to: '/artifacts/$artifactId',
    params: { artifactId: storedActiveDemoArtifactId() },
    replace: true,
  })
} else {
  void demoRouter.load().then(() => {
    selectDemoArtifact(routeArtifactId(window.location.pathname))
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeNanoView?.destroy()
    activePersistedArtifact?.destroy()
  })
}

function selectDemoArtifact(id: string): void {
  const nextArtifact = demoArtifactById(id)
  if (activeArtifactId === nextArtifact.id) return

  activeNanoView?.destroy()
  activePersistedArtifact?.destroy()

  activeArtifactId = nextArtifact.id
  storeActiveDemoArtifactId(nextArtifact.id)
  syncArtifactNav()

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

  if (nextArtifact.kind === 'nano2') {
    activePersistedArtifact = null
    activeNanoView = createNano2Demo(editorMount, nextArtifact.storageKey)
    return
  }

  if (nextArtifact.kind === 'team-knowledge-page-reference') {
    activePersistedArtifact = null
    activeNanoView = createTeamKnowledgePageReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'launch-forecast-grid-reference') {
    activePersistedArtifact = null
    activeNanoView = createLaunchForecastGridReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'issue-triage-desk-reference') {
    activePersistedArtifact = null
    activeNanoView = createIssueTriageDeskReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'mention-command-inbox-reference') {
    activePersistedArtifact = null
    activeNanoView = createMentionCommandInboxReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'board-deck-review-reference') {
    activePersistedArtifact = null
    activeNanoView = createBoardDeckReviewReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'custom-block-audit-report-reference') {
    activePersistedArtifact = null
    activeNanoView = createCustomBlockAuditReportReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'custom-block-renewal-pack-reference') {
    activePersistedArtifact = null
    activeNanoView = createCustomBlockRenewalPackReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'review-collaboration-room-reference') {
    activePersistedArtifact = null
    activeNanoView = createReviewCollaborationRoomReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'review-backend-session-reference') {
    activePersistedArtifact = null
    activeNanoView = createReviewBackendSessionReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'research-report-editor-reference') {
    activePersistedArtifact = null
    activeNanoView = createResearchReportEditorReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'structured-table-review-reference') {
    activePersistedArtifact = null
    activeNanoView = createStructuredTableReviewReference(editorMount)
    return
  }

  if (nextArtifact.kind === 'review-workspace-reference') {
    activePersistedArtifact = null
    activeNanoView = createReviewWorkspaceReference(editorMount)
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

function syncArtifactNav(): void {
  for (const button of artifactList.querySelectorAll<HTMLAnchorElement>('.demo-artifact-button')) {
    const active = button.dataset.artifactId === activeArtifactId
    button.dataset.active = String(active)
    if (active) button.setAttribute('aria-current', 'page')
    else button.removeAttribute('aria-current')
  }
}

function routeArtifactId(pathname: string): string {
  return artifactIdFromPathname(pathname) ?? storedActiveDemoArtifactId()
}

function storedActiveDemoArtifactId(): string {
  if (typeof window === 'undefined') return validDemoArtifactId(null)

  try {
    return validDemoArtifactId(window.localStorage.getItem(ACTIVE_DEMO_ARTIFACT_STORAGE_KEY))
  } catch {
    return validDemoArtifactId(null)
  }
}

function storeActiveDemoArtifactId(id: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ACTIVE_DEMO_ARTIFACT_STORAGE_KEY, id)
  } catch {
    // Active artifact memory is best-effort.
  }
}
