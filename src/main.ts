import './styles/demo-host.css'
import './styles/nano2.css'
import './style.css'
import { createDemoArtifactsApp, type DemoArtifactsAppHandle } from './demo/demo-artifacts-app'
import {
  createNano2ExamplesApp,
  isNano2ExamplesPath,
  type Nano2ExamplesAppHandle,
} from './nano2/examples/app'

const demoRoot = document.querySelector<HTMLDivElement>('#app')

if (!demoRoot) {
  throw new Error('Missing #app')
}

let activeApp: DemoArtifactsAppHandle | Nano2ExamplesAppHandle

if (isNano2ExamplesPath(window.location.pathname)) {
  activeApp = createNano2ExamplesApp(demoRoot)
} else {
  activeApp = createDemoArtifactsApp(demoRoot)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeApp.destroy()
  })
}
