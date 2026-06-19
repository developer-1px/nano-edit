import {
  FileCode2,
  ListTree,
  PanelRightOpen,
  Pin,
  X,
} from 'lucide'
import {
  createInteractionActions,
  createInteractionOwner,
  createInteractionRouter,
  type InteractionKeyRuleDefinition,
  type InteractionKeyTargetKind,
} from '@interactive-os/interaction/runtime'
import type { InspectorTab } from '../../commands/types'
import { labeledSection, shellButton } from './command-elements'
import { lucideIconElement } from '../icons'

export type InspectorMode = 'floating' | 'hidden' | 'pinned'

interface NanoInspectorShellOptions {
  disabled?: boolean
  onIndexSearch: (query: string) => void
  root: HTMLElement
}

interface NanoInspectorShell {
  inspectorElement: HTMLElement
  inspectorTrigger: HTMLButtonElement
  indexOutput: HTMLElement
  markdownOutput: HTMLElement
  destroy: () => void
  showInspector: (tab?: InspectorTab) => void
  setInspectorMode: (mode: InspectorMode) => void
  setInspectorTab: (tab: InspectorTab) => void
  syncInspectorChrome: () => void
}

type InspectorTabMoveDirection = 'first' | 'last' | 'next' | 'previous'

type NanoInspectorInteractionActions = {
  'nano.inspector-tabs.move': { direction: InspectorTabMoveDirection }
}

interface InspectorTabInteractionActions {
  focusTab: (tab: InspectorTab) => void
  selectedTab: InspectorTab
  setTab: (tab: InspectorTab) => void
}

interface NanoInspectorTabInteraction {
  destroy: () => void
  handleTabKeydown: (event: KeyboardEvent, actions: InspectorTabInteractionActions) => void
}

let inspectorShellId = 0
const INSPECTOR_MODE_STORAGE_KEY = 'nano-edit:inspector-mode'
const tabTargetKinds = [
  'native-control',
  'pattern',
  'incidental',
  'unknown',
] satisfies readonly InteractionKeyTargetKind[]

const inspectorTabActions = createInteractionActions<NanoInspectorInteractionActions>()

export function createNanoInspectorShell(options: NanoInspectorShellOptions): NanoInspectorShell {
  inspectorShellId += 1
  const shellId = `nano-inspector-${inspectorShellId}`
  const disabled = options.disabled ?? false
  let inspectorMode = storedInspectorMode()
  let inspectorTab: InspectorTab = 'index'
  const tabInteraction = createNanoInspectorTabInteraction()

  const inspectorElement = document.createElement('aside')
  inspectorElement.className = 'inspector'
  inspectorElement.ariaLabel = 'Inspector'
  const inspectorHeader = document.createElement('div')
  inspectorHeader.className = 'inspector-header'
  const inspectorTabs = document.createElement('div')
  inspectorTabs.className = 'inspector-tabs'
  inspectorTabs.setAttribute('role', 'tablist')
  inspectorTabs.ariaLabel = 'Inspector views'
  const indexTab = shellButton('', 'Index', ListTree)
  indexTab.id = `${shellId}-tab-index`
  indexTab.dataset.icon = 'index'
  indexTab.setAttribute('role', 'tab')
  indexTab.setAttribute('aria-controls', `${shellId}-panel-index`)
  const markdownTab = shellButton('', 'Source', FileCode2)
  markdownTab.id = `${shellId}-tab-source`
  markdownTab.dataset.icon = 'source'
  markdownTab.setAttribute('role', 'tab')
  markdownTab.setAttribute('aria-controls', `${shellId}-panel-source`)
  inspectorTabs.append(indexTab, markdownTab)
  const inspectorControls = document.createElement('div')
  inspectorControls.className = 'inspector-controls'
  const pinButton = shellButton('', 'Pin', Pin)
  pinButton.dataset.icon = 'pin'
  const closeButton = shellButton('', 'Hide', X)
  closeButton.dataset.icon = 'close'
  inspectorControls.append(pinButton, closeButton)
  inspectorHeader.append(inspectorTabs, inspectorControls)

  const indexPanel = document.createElement('div')
  indexPanel.className = 'nano-index-panel'
  const indexSearchInput = document.createElement('input')
  indexSearchInput.className = 'nano-index-search'
  indexSearchInput.type = 'search'
  indexSearchInput.spellcheck = false
  indexSearchInput.placeholder = 'Search'
  indexSearchInput.ariaLabel = 'index search'
  const indexOutput = document.createElement('div')
  indexOutput.className = 'nano-index'
  indexPanel.append(indexSearchInput, indexOutput)
  const markdownOutput = document.createElement('div')
  markdownOutput.className = 'nano-markdown'

  const inspectorBody = document.createElement('div')
  inspectorBody.className = 'inspector-body'
  const indexSection = labeledSection('index', indexPanel)
  indexSection.id = `${shellId}-panel-index`
  indexSection.dataset.inspectorTab = 'index'
  indexSection.setAttribute('role', 'tabpanel')
  indexSection.setAttribute('aria-labelledby', indexTab.id)
  const markdownSection = labeledSection('source', markdownOutput)
  markdownSection.id = `${shellId}-panel-source`
  markdownSection.dataset.inspectorTab = 'markdown'
  markdownSection.setAttribute('role', 'tabpanel')
  markdownSection.setAttribute('aria-labelledby', markdownTab.id)
  inspectorBody.append(indexSection, markdownSection)
  inspectorElement.append(inspectorHeader, inspectorBody)

  const inspectorTrigger = document.createElement('button')
  inspectorTrigger.type = 'button'
  inspectorTrigger.className = 'inspector-trigger'
  inspectorTrigger.title = 'Inspector'
  inspectorTrigger.ariaLabel = 'Inspector'
  inspectorTrigger.append(lucideIconElement(PanelRightOpen, 'nano-shell-icon'))

  const syncInspectorChrome = (): void => {
    options.root.dataset.inspector = disabled ? 'disabled' : inspectorMode
    inspectorElement.hidden = disabled || inspectorMode === 'hidden'
    inspectorTrigger.hidden = disabled
    inspectorTrigger.dataset.tab = inspectorTab
    inspectorTrigger.dataset.active = String(!disabled && inspectorMode !== 'hidden')
    inspectorTrigger.setAttribute('aria-expanded', String(!disabled && inspectorMode !== 'hidden'))
    indexTab.dataset.active = String(inspectorTab === 'index')
    indexTab.setAttribute('aria-selected', String(inspectorTab === 'index'))
    indexTab.tabIndex = inspectorTab === 'index' ? 0 : -1
    markdownTab.dataset.active = String(inspectorTab === 'markdown')
    markdownTab.setAttribute('aria-selected', String(inspectorTab === 'markdown'))
    markdownTab.tabIndex = inspectorTab === 'markdown' ? 0 : -1
    pinButton.dataset.active = String(inspectorMode === 'pinned')
    pinButton.setAttribute('aria-pressed', String(inspectorMode === 'pinned'))
    for (const section of inspectorBody.querySelectorAll<HTMLElement>('[data-inspector-tab]')) {
      section.hidden = section.dataset.inspectorTab !== inspectorTab
    }
  }

  const setInspectorMode = (mode: InspectorMode): void => {
    if (disabled) {
      syncInspectorChrome()
      return
    }
    inspectorMode = mode
    storeInspectorMode(mode)
    syncInspectorChrome()
  }

  const showInspector = (tab: InspectorTab = inspectorTab): void => {
    if (disabled) {
      syncInspectorChrome()
      return
    }
    inspectorTab = tab
    if (inspectorMode === 'hidden') inspectorMode = 'floating'
    storeInspectorMode(inspectorMode)
    syncInspectorChrome()
  }

  const setInspectorTab = (tab: InspectorTab): void => showInspector(tab)
  const handleIndexSearchInput = (): void => options.onIndexSearch(indexSearchInput.value)
  const handleIndexTabClick = (): void => setInspectorTab('index')
  const handleMarkdownTabClick = (): void => setInspectorTab('markdown')
  const handleTabKeydown = (event: KeyboardEvent): void => {
    tabInteraction.handleTabKeydown(event, {
      selectedTab: inspectorTab,
      setTab: setInspectorTab,
      focusTab: (tab) => {
        if (tab === 'index') indexTab.focus()
        else markdownTab.focus()
      },
    })
  }
  const handlePinClick = (): void => setInspectorMode(inspectorMode === 'pinned' ? 'floating' : 'pinned')
  const handleCloseClick = (): void => setInspectorMode('hidden')
  const handleInspectorTriggerClick = (): void => {
    inspectorMode === 'hidden' ? showInspector(inspectorTab) : setInspectorMode('hidden')
  }
  indexSearchInput.addEventListener('input', handleIndexSearchInput)
  indexTab.addEventListener('click', handleIndexTabClick)
  indexTab.addEventListener('keydown', handleTabKeydown)
  markdownTab.addEventListener('click', handleMarkdownTabClick)
  markdownTab.addEventListener('keydown', handleTabKeydown)
  pinButton.addEventListener('click', handlePinClick)
  closeButton.addEventListener('click', handleCloseClick)
  inspectorTrigger.addEventListener('click', handleInspectorTriggerClick)
  syncInspectorChrome()

  const destroy = (): void => {
    indexSearchInput.removeEventListener('input', handleIndexSearchInput)
    indexTab.removeEventListener('click', handleIndexTabClick)
    indexTab.removeEventListener('keydown', handleTabKeydown)
    markdownTab.removeEventListener('click', handleMarkdownTabClick)
    markdownTab.removeEventListener('keydown', handleTabKeydown)
    pinButton.removeEventListener('click', handlePinClick)
    closeButton.removeEventListener('click', handleCloseClick)
    inspectorTrigger.removeEventListener('click', handleInspectorTriggerClick)
    tabInteraction.destroy()
  }

  return { destroy, inspectorElement, inspectorTrigger, indexOutput, markdownOutput, showInspector, setInspectorMode, setInspectorTab, syncInspectorChrome }
}

function storedInspectorMode(): InspectorMode {
  try {
    const stored = window.localStorage.getItem(INSPECTOR_MODE_STORAGE_KEY)
    return stored === 'pinned' ? stored : 'hidden'
  } catch {
    return 'hidden'
  }
}

function storeInspectorMode(mode: InspectorMode): void {
  try {
    if (mode === 'pinned') {
      window.localStorage.setItem(INSPECTOR_MODE_STORAGE_KEY, mode)
      return
    }
    window.localStorage.removeItem(INSPECTOR_MODE_STORAGE_KEY)
  } catch {}
}

function createNanoInspectorTabInteraction(): NanoInspectorTabInteraction {
  const router = createInteractionRouter()
  const unregister = router.register(createInteractionOwner({
    id: 'nano.inspector-tabs',
    kind: 'pattern',
    runtimeKind: 'pattern',
    diagnostics: {
      label: 'Inspector tabs',
      role: 'tablist',
    },
    keyRules: [
      tabMoveRule('previous', ['ArrowLeft']),
      tabMoveRule('next', ['ArrowRight']),
      tabMoveRule('first', ['Home']),
      tabMoveRule('last', ['End']),
    ],
  }), { active: true })

  return {
    destroy: unregister,
    handleTabKeydown: (event, actions) => {
      router.handleEvent(event, {
        onOwnerKey: ({ route }) => {
          const move = inspectorTabActions.getRoute(route, 'nano.inspector-tabs.move')
          if (!move) return

          const tab = movedInspectorTab(actions.selectedTab, move.params.direction)
          actions.setTab(tab)
          actions.focusTab(tab)
        },
      })
    },
  }
}

function tabMoveRule(direction: InspectorTabMoveDirection, keys: readonly string[]): InteractionKeyRuleDefinition {
  return {
    id: `nano.inspector-tabs.${direction}`,
    kind: 'navigation',
    keys,
    targetKinds: tabTargetKinds,
    action: { type: 'nano.inspector-tabs.move', params: { direction } },
    preventDefault: true,
  }
}

function movedInspectorTab(current: InspectorTab, direction: InspectorTabMoveDirection): InspectorTab {
  if (direction === 'first') return 'index'
  if (direction === 'last') return 'markdown'
  return current === 'index' ? 'markdown' : 'index'
}
