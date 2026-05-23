import 'prosemirror-view/style/prosemirror.css'
import './styles/demo-host.css'
import './style.css'
import { createPersistedDemoNanoDocument } from './demo/persisted-document'
import { createNanoView } from './nano-view'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app')
}

const demoDocument = createPersistedDemoNanoDocument()
const nanoView = createNanoView({
  mount: app,
  engine: demoDocument.engine,
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    demoDocument.destroy()
    nanoView.destroy()
  })
}
