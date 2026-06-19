import type { Mark } from 'prosemirror-model'
import type { NanoMark } from '../../entities/document/nano-document-model'

export type NanoMarkType = NanoMark['type']
type NanoMarkFor<TType extends NanoMarkType> = Extract<NanoMark, { type: TType }>

interface NanoMarkCodec<TType extends NanoMarkType> {
  nanoType: TType
  markName: string
  fromNano: (mark: NanoMarkFor<TType>) => Mark
  toNano: (mark: Mark, from: number, to: number) => NanoMarkFor<TType> | null
  key?: (mark: NanoMarkFor<TType>) => string
}

export interface AnyNanoMarkCodec {
  nanoType: NanoMarkType
  markName: string
  fromNano: (mark: NanoMark) => Mark | null
  toNano: (mark: Mark, from: number, to: number) => NanoMark | null
  key: (mark: NanoMark) => string | null
}

export function defineNanoMarkCodec<TType extends NanoMarkType>(
  codec: NanoMarkCodec<TType>,
): AnyNanoMarkCodec {
  return {
    nanoType: codec.nanoType,
    markName: codec.markName,
    fromNano: (mark) => isNanoMarkFor(mark, codec.nanoType)
      ? codec.fromNano(mark)
      : null,
    toNano: codec.toNano,
    key: (mark) => isNanoMarkFor(mark, codec.nanoType)
      ? codec.key?.(mark) ?? mark.type
      : null,
  }
}

function isNanoMarkFor<TType extends NanoMarkType>(
  mark: NanoMark,
  type: TType,
): mark is NanoMarkFor<TType> {
  return mark.type === type
}
