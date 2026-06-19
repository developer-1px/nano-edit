import { noteLinkParts } from '../../entities/reference/nano-note-link'
import type { IndexEntry } from './types'

export function noteLinkDisplayLabel(source: string, fallbackTarget = ''): string | null {
  const raw = source.trim()
  const parts = noteLinkParts(raw || fallbackTarget)
  if (!parts) return null
  return parts.alias || parts.target
}

export function groupedReferenceEntries(
  entries: readonly IndexEntry[],
  blockLabels: ReadonlyMap<string, string>,
): IndexEntry[] {
  const groups = new Map<string, { label: string; target: string; blockIds: string[] }>()

  for (const entry of entries) {
    const target = entry.target ?? entry.label
    const key = target.toLowerCase()
    const group = groups.get(key) ?? { label: entry.label, target, blockIds: [] }
    if (!group.blockIds.includes(entry.blockId)) group.blockIds.push(entry.blockId)
    groups.set(key, group)
  }

  return [...groups.values()].map((group) => ({
    blockId: group.blockIds[0] ?? '',
    blockIds: group.blockIds,
    detail: groupedReferenceDetail(group.blockIds, blockLabels),
    label: group.blockIds.length > 1 ? `${group.label} (${group.blockIds.length})` : group.label,
    target: group.target,
  }))
}

function groupedReferenceDetail(blockIds: readonly string[], blockLabels: ReadonlyMap<string, string>): string | undefined {
  const labels = [...new Set(blockIds.map((id) => blockLabels.get(id) ?? id).filter(Boolean))]
  if (labels.length === 0) return undefined

  const visible = labels.slice(0, 3).join(' / ')
  return labels.length > 3 ? `${visible} / +${labels.length - 3}` : visible
}
