import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile('package.json', 'utf8'))

for (const [name, target] of Object.entries(manifest.exports ?? {})) {
  if (name === './style.css') continue
  if (!target.types?.startsWith('./dist/types/')) {
    throw new Error(`export ${name} must point types at dist/types`)
  }
  if (!target.default?.startsWith('./dist/package/')) {
    throw new Error(`export ${name} must point runtime at dist/package`)
  }
}
