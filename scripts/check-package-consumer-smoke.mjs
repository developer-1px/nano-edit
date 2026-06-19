import { pathToFileURL } from 'node:url'

const root = await import(pathToFileURL('dist/package/index.js'))
const markdown = await import(pathToFileURL('dist/package/codecs/markdown/nano-markdown.js'))

if (typeof root.createNanoDocument !== 'function') {
  throw new Error('root export createNanoDocument is missing')
}

if (typeof markdown.nanoDocumentFromMarkdown !== 'function') {
  throw new Error('markdown export nanoDocumentFromMarkdown is missing')
}
