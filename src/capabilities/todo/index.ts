import type { NanoBlock } from '../../nano-core'

type TodoBlock = Extract<NanoBlock, { type: 'todo' }>

export interface TodoIndexEntry {
  blockId: string
  label: string
  target?: string
  blockIds?: readonly string[]
  detail?: string
  checked: boolean
  checkedMarker?: 'x' | 'X'
}

export function todoIndexEntryFromBlock(block: NanoBlock): TodoIndexEntry | null {
  if (block.type !== 'todo') return null

  return {
    blockId: block.id,
    label: block.text,
    checked: block.checked,
    ...(block.checked && block.checkedMarker === 'X' ? { checkedMarker: 'X' as const } : {}),
  }
}

export function todoIndexTextLabel(todo: TodoIndexEntry): string {
  return `${todo.checked ? `- [${checkedMarker(todo.checkedMarker)}]` : '- [ ]'} ${todo.label}`
}

export function todoIndexBlockLabel(
  block: TodoBlock,
  plainTextPreview: (text: string) => string,
): string {
  return `- [${block.checked ? checkedMarker(block.checkedMarker) : ' '}] ${plainTextPreview(block.text)}`
}

function checkedMarker(marker: unknown): 'x' | 'X' {
  return marker === 'X' ? 'X' : 'x'
}
