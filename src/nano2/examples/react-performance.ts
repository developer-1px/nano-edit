import { RefreshCw } from 'lucide'
import { createNano2View, type Nano2ViewHandle } from '..'
import { nano2PerformanceSnapshot } from '../performance'
import type { NanoDocument } from '../../entities/document/nano-document-model'
import { lucideIconElement } from '../../view/icons'
import {
  createPersistedNano2ExampleDocument,
  type PersistedNano2ExampleDocument,
} from './persistence'
import type { Nano2ExampleSurfaceHandle } from './collaboration'

export function createNano2ReactPerformanceExample(options: {
  document: NanoDocument
  mount: HTMLElement
  storageKey: string
}): Nano2ExampleSurfaceHandle {
  const root = document.createElement('section')
  root.className = 'nano2-performance'
  root.dataset.hostRenders = '0'
  root.dataset.snapshotRenders = '0'
  root.dataset.viewMounts = '0'

  const controls = document.createElement('div')
  controls.className = 'nano2-performance-controls'

  const renderButton = document.createElement('button')
  renderButton.type = 'button'
  renderButton.className = 'nano2-performance-button'
  renderButton.dataset.action = 'host-render'
  renderButton.title = 'Render host'
  renderButton.setAttribute('aria-label', 'Render host')
  renderButton.append(lucideIconElement(RefreshCw, 'nano2-performance-button-icon'))

  const metrics = document.createElement('div')
  metrics.className = 'nano2-performance-metrics'

  const hostMetric = metricElement('host', '0')
  const viewMetric = metricElement('view', '0')
  const snapshotMetric = metricElement('words', '0')

  metrics.append(hostMetric, viewMetric, snapshotMetric)
  controls.append(renderButton, metrics)

  const editorMount = document.createElement('div')
  editorMount.className = 'nano2-performance-editor'

  root.append(controls, editorMount)
  options.mount.replaceChildren(root)

  let hostRenders = 0
  let snapshotRenders = 0
  let viewMounts = 0
  const persisted: PersistedNano2ExampleDocument = createPersistedNano2ExampleDocument({
    initialDocument: options.document,
    storageKey: options.storageKey,
  })
  const view: Nano2ViewHandle = createNano2View({
    mount: editorMount,
    engine: persisted.engine,
    ariaLabel: 'Nano2 React Performance example',
  })
  viewMounts += 1

  const unsubscribeSnapshot = persisted.engine.subscribe(() => {
    snapshotRenders += 1
    renderMetrics()
  })

  const renderHost = () => {
    hostRenders += 1
    renderMetrics()
  }

  renderButton.addEventListener('click', renderHost)
  renderMetrics()

  return {
    destroy: () => {
      renderButton.removeEventListener('click', renderHost)
      unsubscribeSnapshot()
      view.destroy()
      persisted.destroy()
      root.remove()
    },
  }

  function renderMetrics(): void {
    const snapshot = nano2PerformanceSnapshot(persisted.engine.value)
    root.dataset.hostRenders = String(hostRenders)
    root.dataset.snapshotRenders = String(snapshotRenders)
    root.dataset.viewMounts = String(viewMounts)
    root.dataset.wordCount = String(snapshot.wordCount)
    hostMetric.dataset.value = String(hostRenders)
    hostMetric.textContent = `host ${hostRenders}`
    viewMetric.dataset.value = String(viewMounts)
    viewMetric.textContent = `view ${viewMounts}`
    snapshotMetric.dataset.value = String(snapshot.wordCount)
    snapshotMetric.textContent = `words ${snapshot.wordCount}`
  }
}

function metricElement(name: string, value: string): HTMLElement {
  const element = document.createElement('span')
  element.className = 'nano2-performance-metric'
  element.dataset.metric = name
  element.dataset.value = value
  element.textContent = `${name} ${value}`
  return element
}
