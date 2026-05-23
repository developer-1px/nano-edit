import type { Mark } from 'prosemirror-model'
import type { NanoMark } from './nano-core'
import { basicNanoMarkCodecs } from './prosemirror-basic-mark-codecs'
import type { AnyNanoMarkCodec, NanoMarkType } from './prosemirror-mark-codec-types'
import { referenceNanoMarkCodecs } from './prosemirror-reference-mark-codecs'

const nanoMarkCodecs: readonly AnyNanoMarkCodec[] = [
  ...basicNanoMarkCodecs,
  ...referenceNanoMarkCodecs,
]

export function prosemirrorMarkFromNanoMark(mark: NanoMark): Mark | null {
  return nanoMarkCodecForNanoType(mark.type)?.fromNano(mark) ?? null
}

export function nanoMarkFromProseMirrorMark(mark: Mark, from: number, to: number): NanoMark | null {
  if (from >= to) return null
  return nanoMarkCodecForMarkName(mark.type.name)?.toNano(mark, from, to) ?? null
}

export function markKey(mark: NanoMark): string {
  return nanoMarkCodecForNanoType(mark.type)?.key(mark) ?? mark.type
}

function nanoMarkCodecForNanoType(type: NanoMarkType): AnyNanoMarkCodec | null {
  return nanoMarkCodecs.find((codec) => codec.nanoType === type) ?? null
}

function nanoMarkCodecForMarkName(markName: string): AnyNanoMarkCodec | null {
  return nanoMarkCodecs.find((codec) => codec.markName === markName) ?? null
}
