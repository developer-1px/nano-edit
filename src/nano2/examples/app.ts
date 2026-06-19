import { createNano2View, type Nano2ViewHandle } from '..'
import {
  nano2ExampleById,
  nano2Examples,
  validNano2ExampleId,
  type Nano2ExampleDefinition,
  type Nano2ExampleTrack,
} from './registry'
import {
  nano2ExampleHref,
  nano2ExampleIdFromPathname,
  nano2ExamplesRouter,
} from './router'
import {
  createPersistedNano2ExampleDocument,
  nano2ExampleStorageKey,
  type PersistedNano2ExampleDocument,
} from './persistence'

export { isNano2ExamplesPath } from './router'

export interface Nano2ExamplesAppHandle {
  destroy(): void
}

export function createNano2ExamplesApp(root: HTMLElement): Nano2ExamplesAppHandle {
  const shell = document.createElement('section')
  shell.className = 'nano2-examples'

  const nav = document.createElement('aside')
  nav.className = 'nano2-example-nav'
  nav.ariaLabel = 'Nano2 examples'

  const navTitle = document.createElement('a')
  navTitle.className = 'nano2-example-nav-title'
  navTitle.href = nano2ExampleHref('basics')
  navTitle.textContent = 'Nano2 Examples'

  const list = document.createElement('div')
  list.className = 'nano2-example-list'

  const main = document.createElement('main')
  main.className = 'nano2-example-main'

  const header = document.createElement('header')
  header.className = 'nano2-example-header'

  const content = document.createElement('div')
  content.className = 'nano2-example-content'

  nav.append(navTitle, list)
  main.append(header, content)
  shell.append(nav, main)
  root.replaceChildren(shell)

  let activeExampleId: string | null = null
  let activeView: Nano2ViewHandle | null = null
  let activeDocument: PersistedNano2ExampleDocument | null = null

  for (const track of nano2ExampleTracks) {
    const sectionTitle = document.createElement('div')
    sectionTitle.className = 'nano2-example-section-title'
    sectionTitle.textContent = nano2ExampleTrackLabel(track)
    list.append(sectionTitle)

    for (const example of nano2Examples.filter((candidate) => candidate.track === track)) {
      const link = document.createElement('a')
      link.className = 'nano2-example-link'
      link.href = nano2ExampleHref(example.id)
      link.dataset.exampleId = example.id
      link.dataset.phase = example.phase
      link.dataset.status = example.status

      const phase = document.createElement('span')
      phase.className = 'nano2-example-link-phase'
      phase.textContent = example.phase

      const title = document.createElement('span')
      title.className = 'nano2-example-link-title'
      title.textContent = example.title

      link.append(phase, title)
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        if (event.button !== 0) return
        event.preventDefault()
        void nano2ExamplesRouter.navigate({
          to: '/nano2/$exampleId',
          params: { exampleId: example.id },
        }).then(() => {
          selectExample(example.id)
        })
      })
      list.append(link)
    }
  }

  const unsubscribeRouter = nano2ExamplesRouter.subscribe('onResolved', (event) => {
    selectExample(routeExampleId(event.toLocation.pathname))
  })

  const initialExampleId = routeExampleId(window.location.pathname)
  if (window.location.pathname === '/nano2' || window.location.pathname === '/nano2/' || window.location.pathname.startsWith('/artifacts/nano2')) {
    void nano2ExamplesRouter.navigate({
      to: '/nano2/$exampleId',
      params: { exampleId: initialExampleId },
      replace: true,
    }).then(() => {
      selectExample(initialExampleId)
    })
  } else {
    void nano2ExamplesRouter.load().then(() => {
      selectExample(initialExampleId)
    })
  }

  return {
    destroy: () => {
      unsubscribeRouter()
      activeView?.destroy()
      activeDocument?.destroy()
      shell.remove()
    },
  }

  function selectExample(id: string): void {
    const example = nano2ExampleById(id)
    if (activeExampleId === example.id) return

    activeView?.destroy()
    activeDocument?.destroy()
    activeView = null
    activeDocument = null
    activeExampleId = example.id

    renderHeader(header, example)
    syncNav()

    if (example.status === 'ready' && example.document) {
      activeDocument = createPersistedNano2ExampleDocument({
        initialDocument: example.document,
        storageKey: nano2ExampleStorageKey(example.id),
      })
      activeView = createNano2View({
        mount: content,
        engine: activeDocument.engine,
        ariaLabel: `Nano2 ${example.title} example`,
      })
      return
    }

    content.replaceChildren(renderContract(example))
  }

  function syncNav(): void {
    for (const link of list.querySelectorAll<HTMLAnchorElement>('.nano2-example-link')) {
      const active = link.dataset.exampleId === activeExampleId
      link.dataset.active = String(active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    }
  }
}

const nano2ExampleTracks: readonly Nano2ExampleTrack[] = ['prosemirror', 'tiptap']

function nano2ExampleTrackLabel(track: Nano2ExampleTrack): string {
  return track === 'tiptap' ? 'Tiptap' : 'ProseMirror'
}

function routeExampleId(pathname: string): string {
  return nano2ExampleIdFromPathname(pathname) ?? validNano2ExampleId(null)
}

function renderHeader(target: HTMLElement, example: Nano2ExampleDefinition): void {
  const titleGroup = document.createElement('div')
  titleGroup.className = 'nano2-example-title-group'

  const phase = document.createElement('span')
  phase.className = 'nano2-example-phase'
  phase.textContent = example.phase

  const title = document.createElement('h1')
  title.className = 'nano2-example-title'
  title.textContent = example.title

  const status = document.createElement('span')
  status.className = 'nano2-example-status'
  status.dataset.status = example.status
  status.textContent = example.status

  titleGroup.append(phase, title, status)

  const source = document.createElement('a')
  source.className = 'nano2-example-source'
  source.href = example.sourceHref
  source.rel = 'noreferrer'
  source.target = '_blank'
  source.textContent = 'ProseMirror'

  target.replaceChildren(titleGroup, source)
}

function renderContract(example: Nano2ExampleDefinition): HTMLElement {
  const contract = document.createElement('section')
  contract.className = 'nano2-example-contract'

  contract.append(
    renderContractRow('Pressure', example.pressure),
    renderContractRow('Headless', example.headless),
    renderContractRow('View', example.view),
    renderContractRow('Acceptance', example.acceptance),
  )

  return contract
}

function renderContractRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div')
  row.className = 'nano2-example-contract-row'

  const term = document.createElement('div')
  term.className = 'nano2-example-contract-label'
  term.textContent = label

  const description = document.createElement('p')
  description.className = 'nano2-example-contract-text'
  description.textContent = value

  row.append(term, description)
  return row
}
