import { createNano2View, type Nano2ViewHandle } from '../nano2'
import { createPersistedDemoNanoDocument, type PersistedDemoNanoDocument } from './persisted-document'
import { nano2DemoDocument } from './nano2-document'

export interface Nano2DemoHandle {
  destroy(): void
}

export function createNano2Demo(mount: HTMLElement, storageKey: string): Nano2DemoHandle {
  const persisted: PersistedDemoNanoDocument = createPersistedDemoNanoDocument({
    initialDocument: nano2DemoDocument,
    storageKey,
  })
  const view: Nano2ViewHandle = createNano2View({
    mount,
    engine: persisted.engine,
    ariaLabel: 'Nano2 editor',
  })

  return {
    destroy: () => {
      view.destroy()
      persisted.destroy()
    },
  }
}
