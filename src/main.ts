import 'prosemirror-view/style/prosemirror.css'
import './style.css'
import { createDemoNanoDocument } from './demo/initial-document'
import { createNanoView } from './nano-view'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app')
}

createNanoView({
  mount: app,
  engine: createDemoNanoDocument(),
})
