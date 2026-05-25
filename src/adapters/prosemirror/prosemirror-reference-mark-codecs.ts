import { footnoteName } from '../../core/nano-footnote'
import { nonBlankStringValue } from '../../core/schema/nano-block-schema-refinements'
import { normalizeTagName } from '../../core/nano-tag'
import {
  destinationStyle,
  linkSyntax,
} from './prosemirror-atom-dom'
import type { AnyNanoMarkCodec } from './prosemirror-mark-codec-types'
import { defineNanoMarkCodec } from './prosemirror-mark-codec-types'
import { nanoMarkNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'

export const referenceNanoMarkCodecs: readonly AnyNanoMarkCodec[] = [
  defineNanoMarkCodec({
    nanoType: 'tag',
    markName: nanoMarkNames.tag,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.tag].create({ name: mark.name }),
    toNano: (mark, from, to) => {
      const name = nonBlankStringValue(normalizeTagName(String(mark.attrs.name ?? '')))
      return name ? { type: 'tag', from, to, name } : null
    },
    key: (mark) => `${mark.type}:${mark.name}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'note_link',
    markName: nanoMarkNames.noteLink,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.noteLink].create({ target: mark.target, alias: mark.alias ?? '' }),
    toNano: (mark, from, to) => {
      const target = nonBlankStringValue(mark.attrs.target)
      return target ? {
        type: 'note_link',
        from,
        to,
        target,
        ...(mark.attrs.alias ? { alias: String(mark.attrs.alias) } : {}),
      } : null
    },
    key: (mark) => `${mark.type}:${mark.target}:${mark.alias ?? ''}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'math',
    markName: nanoMarkNames.math,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.math].create({ formula: mark.formula }),
    toNano: (mark, from, to) => {
      const formula = nonBlankStringValue(mark.attrs.formula)
      return formula ? { type: 'math', from, to, formula } : null
    },
    key: (mark) => `${mark.type}:${mark.formula}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'footnote_ref',
    markName: nanoMarkNames.footnoteRef,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.footnoteRef].create({ name: mark.name }),
    toNano: (mark, from, to) => {
      const name = nonBlankStringValue(footnoteName(String(mark.attrs.name ?? '')))
      return name ? { type: 'footnote_ref', from, to, name } : null
    },
    key: (mark) => `${mark.type}:${mark.name}`,
  }),
  defineNanoMarkCodec({
    nanoType: 'link',
    markName: nanoMarkNames.link,
    fromNano: (mark) => nanoSchema.marks[nanoMarkNames.link].create({
      href: mark.href,
      destinationStyle: destinationStyle(mark.destinationStyle),
      title: mark.title ?? '',
      syntax: linkSyntax(mark.syntax),
      image: mark.image === true,
      imageEmptyAlt: mark.imageEmptyAlt === true,
    }),
    toNano: (mark, from, to) => {
      const href = nonBlankStringValue(mark.attrs.href)
      if (!href) return null

      const syntax = linkSyntax(mark.attrs.syntax)
      const markDestinationStyle = destinationStyle(mark.attrs.destinationStyle)
      const image = mark.attrs.image === true
      const imageEmptyAlt = image && mark.attrs.imageEmptyAlt === true
      return {
        type: 'link',
        from,
        to,
        href,
        ...(markDestinationStyle ? { destinationStyle: markDestinationStyle } : {}),
        ...(mark.attrs.title ? { title: String(mark.attrs.title) } : {}),
        ...(syntax ? { syntax } : {}),
        ...(image ? { image: true } : {}),
        ...(imageEmptyAlt ? { imageEmptyAlt: true } : {}),
      }
    },
    key: (mark) => `${mark.type}:${mark.href}:${mark.title ?? ''}:${mark.syntax ?? ''}:${mark.destinationStyle ?? ''}:${mark.image === true ? 'image' : ''}:${mark.imageEmptyAlt === true ? 'empty-alt' : ''}`,
  }),
]
