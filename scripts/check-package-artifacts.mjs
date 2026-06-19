import { access } from 'node:fs/promises'

const required = [
  'dist/package/index.js',
  'dist/package/style.css',
  'dist/types/index.d.ts',
]

await Promise.all(required.map((file) => access(file)))
