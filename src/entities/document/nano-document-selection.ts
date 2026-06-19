import type {
  JSONPatchOperation,
  Pointer,
  SelectionPoint,
  SelectionRange,
  SelectionSnap,
} from '@interactive-os/json-document'
import { nanoBlocksEqual } from './nano-document-equality'
import type { NanoBlock, NanoDocument } from './nano-document-model'

export function blocksPointer(): Pointer {
  return '/blocks'
}

export function blockTextPointer(index: number): Pointer {
  return `/blocks/${index}/text`
}

export function point(path: Pointer, offset: number): SelectionPoint {
  return { path, offset }
}

export function selectionSnap(anchor: SelectionPoint, focus: SelectionPoint): SelectionSnap {
  const range: SelectionRange = { anchor, focus }
  return {
    selectedPointers: [pointPath(focus)],
    selectionRanges: [range],
    primaryIndex: 0,
    anchor,
    focus,
  }
}

export function pointPath(value: SelectionPoint): Pointer {
  return typeof value === 'string' ? value : value.path
}

export function pointOffset(value: SelectionPoint): number {
  return typeof value === 'string' ? 0 : Math.max(0, value.offset ?? 0)
}

export function replaceBlocksPatch(
  current: NanoDocument,
  nextBlocks: NanoBlock[],
): JSONPatchOperation[] {
  return nanoBlocksEqual(current.blocks, nextBlocks)
    ? []
    : [{ op: 'replace', path: blocksPointer(), value: nextBlocks }]
}
