import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const files = [
  ['inline-edit', '../src/inline-edit/index.ts'],
  ['inline-autocomplete', '../src/inline-autocomplete/index.ts'],
  ['autocomplete', '../src/autocomplete/index.ts'],
  ['autocomplete-types', '../src/autocomplete/types.ts'],
  ['markdown', '../src/codecs/markdown/nano-markdown.ts'],
  ['markdown-types', '../src/codecs/markdown/types.ts'],
  ['document-index', '../src/indexing/nano-document-index.ts'],
  ['document-index-types', '../src/indexing/document-index/types.ts'],
  ['model', '../src/model/index.ts'],
  ['inline-tokens', '../src/inline-tokens/index.ts'],
]

console.log('# Consumer Blind API Snapshot')
console.log('')
console.log('## Package Exports')
console.log('')

for (const [key, value] of Object.entries(packageJson.exports)) {
  if (key === './style.css') continue
  console.log(`- \`${exportName(key)}\` -> \`${value}\``)
}

for (const [label, path] of files) {
  const fileUrl = new URL(path, import.meta.url)
  const source = readFileSync(fileUrl, 'utf8').trim()
  console.log('')
  console.log(`## ${label}`)
  console.log('')
  console.log('```ts')
  console.log(source)
  console.log('```')

  const signatures = reexportedFunctionSignatures(source, fileUrl)
  if (signatures.length > 0) {
    console.log('')
    console.log(`### ${label} signatures`)
    console.log('')
    console.log('```ts')
    for (const signature of signatures) console.log(signature)
    console.log('```')
  }
}

console.log('')
console.log('## Blind Condition')
console.log('')
console.log('- Do not inspect implementation files, demo files, or repo history.')
console.log('- Use only this snapshot, the benchmark task, and allowed consumer examples.')
console.log('- If implementation details feel necessary, classify that as docs/example gap or discoverability/name.')

function exportName(key) {
  if (key === '.') return packageJson.name
  return `${packageJson.name}/${key.replace(/^\.\//, '')}`
}

// A barrel like `export { fn } from './x'` hides the re-exported function
// signatures. Follow each relative re-export and surface the `export function`
// declaration heads (without bodies) so blind consumers see call signatures.
function reexportedFunctionSignatures(barrelSource, barrelUrl) {
  const relativePaths = new Set(
    [...barrelSource.matchAll(/from '(\.[^']+)'/g)].map((match) => match[1]),
  )
  const signatures = []
  for (const relativePath of relativePaths) {
    const targetUrl = new URL(relativePath.endsWith('.ts') ? relativePath : `${relativePath}.ts`, barrelUrl)
    let targetSource
    try {
      targetSource = readFileSync(targetUrl, 'utf8')
    } catch {
      continue
    }
    for (const match of targetSource.matchAll(/export\s+(?:async\s+)?function\s+\w+[^{]*/g)) {
      signatures.push(match[0].replace(/\s+/g, ' ').trim())
    }
    // Flat token/result types are part of the call contract (offset fields,
    // etc.) but a barrel hides their bodies. Surface single-level interfaces
    // and type aliases too.
    for (const match of targetSource.matchAll(/export interface \w+\s*\{[^{}]*\}/g)) {
      signatures.push(match[0].trim())
    }
    for (const match of targetSource.matchAll(/export type \w+\s*=[^\n]+/g)) {
      signatures.push(match[0].trim())
    }
  }
  return signatures
}
