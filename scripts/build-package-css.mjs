import { cp, mkdir } from 'node:fs/promises'

await mkdir('dist/package/styles', { recursive: true })
await cp('src/style.css', 'dist/package/style.css')
await cp('src/styles', 'dist/package/styles', { recursive: true })
