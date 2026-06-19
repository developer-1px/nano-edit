import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const target = process.argv[2]

if (!target) {
  throw new Error('usage: node scripts/clean-package-artifacts.mjs <dir>')
}

const resolved = resolve(target)
await rm(resolved, { force: true, recursive: true })
await mkdir(resolved, { recursive: true })
