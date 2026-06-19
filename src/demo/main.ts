import '../style.css'
import '../styles/demo-host.css'
import { createDemoArtifactsApp } from './demo-artifacts-app'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Missing #app')
}

const app = createDemoArtifactsApp(root)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.destroy()
  })
}
