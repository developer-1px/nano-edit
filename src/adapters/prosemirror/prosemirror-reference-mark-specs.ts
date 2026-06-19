import type { MarkSpec } from 'prosemirror-model'
import {
  firstNonBlankStringValue,
  nonBlankStringValue,
} from '../../entities/block/schema/nano-block-schema-refinements'
import { footnoteName } from '../../entities/reference/nano-footnote'
import { inlineMathFormula } from '../../entities/math/nano-math'
import { noteLinkParts } from '../../entities/reference/nano-note-link'
import { normalizeTagName, tagDisplayLabel, tagNameFromToken } from '../../entities/reference/nano-tag'
import { nanoMarkNames } from './prosemirror-names'
import { prosemirrorParseDomElement } from './prosemirror-parse-dom'
import { labelledSourceTokenDomSpec } from './prosemirror-source-token'

export const referenceMarkSpecs: Record<string, MarkSpec> = {
  [nanoMarkNames.tag]: {
    attrs: { name: {} },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-tag',
      getAttrs: (dom) => {
        const element = prosemirrorParseDomElement(dom)
        if (!element) return false

        const name = firstNonBlankStringValue(
          tagNameFromToken(element.textContent ?? ''),
          normalizeTagName(element.dataset.tag ?? ''),
          normalizeTagName(element.textContent ?? ''),
        )
        return name ? { name } : false
      },
    }],
    toDOM: (mark) => {
      const name = normalizeTagName(String(mark.attrs.name ?? ''))
      const label = tagDisplayLabel(name) ?? name
      return labelledSourceTokenDomSpec('span', 'nano-tag', label, { 'data-tag': name, title: label })
    },
  },
  [nanoMarkNames.noteLink]: {
    attrs: { target: {}, alias: { default: '' } },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-note-link',
      getAttrs: (dom) => {
        const element = prosemirrorParseDomElement(dom)
        if (!element) return false

        const parts = noteLinkParts(element.dataset.target ?? '') ?? noteLinkParts(element.textContent ?? '')
        const target = nonBlankStringValue(parts?.target)
        return target ? { target, alias: element.dataset.alias ?? parts?.alias ?? '' } : false
      },
    }],
    toDOM: (mark) => {
      const label = String(mark.attrs.alias || mark.attrs.target || '')
      return labelledSourceTokenDomSpec('span', 'nano-note-link', label, {
        'data-target': mark.attrs.target,
        ...(mark.attrs.alias ? { 'data-alias': mark.attrs.alias } : {}),
        title: label,
      })
    },
  },
  [nanoMarkNames.math]: {
    attrs: { formula: {} },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-math',
      getAttrs: (dom) => {
        const element = prosemirrorParseDomElement(dom)
        if (!element) return false

        const formula = firstNonBlankStringValue(
          element.dataset.formula,
          inlineMathFormula(element.textContent ?? ''),
        )
        return formula ? { formula } : false
      },
    }],
    toDOM: (mark) => labelledSourceTokenDomSpec('span', 'nano-math', String(mark.attrs.formula ?? ''), {
      'data-formula': mark.attrs.formula,
      title: mark.attrs.formula,
    }),
  },
  [nanoMarkNames.footnoteRef]: {
    attrs: { name: {} },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-footnote-ref',
      getAttrs: (dom) => {
        const element = prosemirrorParseDomElement(dom)
        if (!element) return false

        const name = firstNonBlankStringValue(
          footnoteName(element.dataset.name ?? ''),
          footnoteName(element.textContent ?? ''),
        )
        return name ? { name } : false
      },
    }],
    toDOM: (mark) => {
      const name = footnoteName(String(mark.attrs.name ?? '')) || '1'
      return labelledSourceTokenDomSpec('span', 'nano-footnote-ref', name, {
        'data-name': name,
        title: name,
      })
    },
  },
}
