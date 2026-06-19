import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'

const roots = ['dist/package', 'dist/types']

for (const root of roots) {
  await rewriteTree(root)
}

async function rewriteTree(root) {
  for (const file of await files(root)) {
    if (!file.endsWith('.js') && !file.endsWith('.d.ts')) continue

    const source = await readFile(file, 'utf8')
    const next = source
      .replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (_match, before, specifier, after) => {
        return `${before}${resolvedSpecifier(file, specifier)}${after}`
      })
      .replace(/(import\s+['"])(\.[^'"]+)(['"])/g, (_match, before, specifier, after) => {
        return `${before}${resolvedSpecifier(file, specifier)}${after}`
      })

    if (next !== source) await writeFile(file, next)
  }
}

function resolvedSpecifier(file, specifier) {
  if (extname(specifier)) return specifier
  if (specifier.endsWith('/')) return `${specifier}index.js`

  const base = resolve(dirname(file), specifier)
  const sourceExtension = file.endsWith('.d.ts') ? '.d.ts' : '.js'
  return existsSync(`${base}${sourceExtension}`) ? `${specifier}.js` : `${specifier}/index.js`
}

async function files(root) {
  const output = []
  await walk(root, output)
  return output
}

async function walk(dir, output) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(path, output)
    } else {
      output.push(path)
    }
  }
}
