import { spawnSync } from 'node:child_process'

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

const packs = JSON.parse(result.stdout)
if (!Array.isArray(packs) || packs.length === 0) {
  throw new Error('npm pack did not report a package')
}
