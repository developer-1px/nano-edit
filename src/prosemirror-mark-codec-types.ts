import type { Mark } from 'prosemirror-model'
import type { NanoMark } from './nano-core'

export type NanoMarkType = NanoMark['type']
export type NanoMarkFor<TType extends NanoMarkType> = Extract<NanoMark, { type: TType }>

export interface NanoMarkCodec<TType extends NanoMarkType> {
  nanoType: TType
  markName: string
  fromNano: (mark: NanoMarkFor<TType>) => Mark
  toNano: (mark: Mark, from: number, to: number) => NanoMarkFor<TType>
  key?: (mark: NanoMarkFor<TType>) => string
}

export interface AnyNanoMarkCodec {
  nanoType: NanoMarkType
  markName: string
  fromNano: (mark: NanoMark) => Mark | null
  toNano: (mark: Mark, from: number, to: number) => NanoMark
  key: (mark: NanoMark) => string | null
}

export function defineNanoMarkCodec<TType extends NanoMarkType>(
  codec: NanoMarkCodec<TType>,
): AnyNanoMarkCodec {
  return {
    nanoType: codec.nanoType,
    markName: codec.markName,
    fromNano: (mark) => mark.type === codec.nanoType
      ? codec.fromNano(mark as NanoMarkFor<TType>)
      : null,
    toNano: codec.toNano as (mark: Mark, from: number, to: number) => NanoMark,
    key: (mark) => mark.type === codec.nanoType
      ? codec.key?.(mark as NanoMarkFor<TType>) ?? mark.type
      : null,
  }
}
