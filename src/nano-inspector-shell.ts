import {
  FileCode2,
  ListTree,
  PanelRightOpen,
  Pin,
  X,
} from 'lucide'
import type { InspectorMode, InspectorTab } from './nano-command-surface'
import { labeledSection, shellButton } from './nano-command-elements'
import { lucideIconElement } from './nano-icons'
import { storedInspectorMode, storeInspectorMode } from './nano-inspector-storage'

interface NanoInspectorShellOptions {
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

export function createNanoInspectorShell(options: NanoInspectorShellOptions): NanoInspectorShell {
  let inspectorMode = storedInspectorMode()
  let inspectorTab: InspectorTab = 'index'

  const inspectorElement = document.createElement('aside')
  inspectorElement.className = 'inspector'
  const inspectorHeader = document.createElement('div')
  inspectorHeader.className = 'inspector-header'
  const inspectorTabs = document.createElement('div')
  inspectorTabs.className = 'inspector-tabs'
  const indexTab = shellButton('', 'Index', ListTree)
  indexTab.dataset.icon = 'index'
  const markdownTab = shellButton('', 'Source', FileCode2)
  markdownTab.dataset.icon = 'source'
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
  indexSection.dataset.inspectorTab = 'index'
  const markdownSection = labeledSection('source', markdownOutput)
  markdownSection.dataset.inspectorTab = 'markdown'
  inspectorBody.append(indexSection, markdownSection)
  inspectorElement.append(inspectorHeader, inspectorBody)

  const inspectorTrigger = document.createElement('button')
  inspectorTrigger.type = 'button'
  inspectorTrigger.className = 'inspector-trigger'
  inspectorTrigger.title = 'Inspector'
  inspectorTrigger.ariaLabel = 'Inspector'
  inspectorTrigger.append(lucideIconElement(PanelRightOpen, 'nano-shell-icon'))

  const syncInspectorChrome = (): void => {
    options.root.dataset.inspector = inspectorMode
    inspectorElement.hidden = inspectorMode === 'hidden'
    inspectorTrigger.dataset.tab = inspectorTab
    inspectorTrigger.dataset.active = String(inspectorMode !== 'hidden')
    indexTab.dataset.active = String(inspectorTab === 'index')
    markdownTab.dataset.active = String(inspectorTab === 'markdown')
    pinButton.dataset.active = String(inspectorMode === 'pinned')
    for (const section of inspectorBody.querySelectorAll<HTMLElement>('[data-inspector-tab]')) {
      section.hidden = section.dataset.inspectorTab !== inspectorTab
    }
  }

  const setInspectorMode = (mode: InspectorMode): void => {
    inspectorMode = mode
    storeInspectorMode(mode)
    syncInspectorChrome()
  }

  const showInspector = (tab: InspectorTab = inspectorTab): void => {
    inspectorTab = tab
    if (inspectorMode === 'hidden') inspectorMode = 'floating'
    storeInspectorMode(inspectorMode)
    syncInspectorChrome()
  }

  const setInspectorTab = (tab: InspectorTab): void => showInspector(tab)
  const handleIndexSearchInput = (): void => options.onIndexSearch(indexSearchInput.value)
  const handleIndexTabClick = (): void => setInspectorTab('index')
  const handleMarkdownTabClick = (): void => setInspectorTab('markdown')
  const handlePinClick = (): void => setInspectorMode(inspectorMode === 'pinned' ? 'floating' : 'pinned')
  const handleCloseClick = (): void => setInspectorMode('hidden')
  const handleInspectorTriggerClick = (): void => {
    inspectorMode === 'hidden' ? showInspector(inspectorTab) : setInspectorMode('hidden')
  }
  indexSearchInput.addEventListener('input', handleIndexSearchInput)
  indexTab.addEventListener('click', handleIndexTabClick)
  markdownTab.addEventListener('click', handleMarkdownTabClick)
  pinButton.addEventListener('click', handlePinClick)
  closeButton.addEventListener('click', handleCloseClick)
  inspectorTrigger.addEventListener('click', handleInspectorTriggerClick)
  syncInspectorChrome()

  const destroy = (): void => {
    indexSearchInput.removeEventListener('input', handleIndexSearchInput)
    indexTab.removeEventListener('click', handleIndexTabClick)
    markdownTab.removeEventListener('click', handleMarkdownTabClick)
    pinButton.removeEventListener('click', handlePinClick)
    closeButton.removeEventListener('click', handleCloseClick)
    inspectorTrigger.removeEventListener('click', handleInspectorTriggerClick)
  }

  return { destroy, inspectorElement, inspectorTrigger, indexOutput, markdownOutput, showInspector, setInspectorMode, setInspectorTab, syncInspectorChrome }
}
