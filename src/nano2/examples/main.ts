import '../../style.css'
import '../../styles/nano2.css'
import { createNano2ExamplesApp } from './app'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Missing #app')
}

const app = createNano2ExamplesApp(root)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.destroy()
  })
}
