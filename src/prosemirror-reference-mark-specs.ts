import type { MarkSpec } from 'prosemirror-model'
import { footnoteName } from './nano-footnote'
import { inlineMathFormula } from './nano-math'
import { noteLinkParts } from './nano-note-link'
import { normalizeTagName, tagDisplayLabel, tagNameFromToken } from './nano-tag'
import { nanoMarkNames } from './prosemirror-names'
import { sourceTokenAttrs } from './prosemirror-source-token'

export const referenceMarkSpecs: Record<string, MarkSpec> = {
  [nanoMarkNames.tag]: {
    attrs: { name: {} },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-tag',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        return {
          name: tagNameFromToken(element.textContent ?? '')
            ?? normalizeTagName(element.dataset.tag ?? ''),
        }
      },
    }],
    toDOM: (mark) => {
      const name = normalizeTagName(String(mark.attrs.name ?? ''))
      const label = tagDisplayLabel(name) ?? name
      return ['span', sourceTokenAttrs('nano-tag', { 'data-tag': name, 'data-label': label, title: label }), 0]
    },
  },
  [nanoMarkNames.noteLink]: {
    attrs: { target: {}, alias: { default: '' } },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-note-link',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        const parts = noteLinkParts(element.dataset.target ?? element.textContent ?? '')
        return { target: parts?.target ?? '', alias: element.dataset.alias ?? parts?.alias ?? '' }
      },
    }],
    toDOM: (mark) => {
      const label = String(mark.attrs.alias || mark.attrs.target || '')
      return ['span', sourceTokenAttrs('nano-note-link', {
        'data-target': mark.attrs.target,
        'data-label': label,
        ...(mark.attrs.alias ? { 'data-alias': mark.attrs.alias } : {}),
        title: label,
      }), 0]
    },
  },
  [nanoMarkNames.math]: {
    attrs: { formula: {} },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-math',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        return { formula: element.dataset.formula ?? inlineMathFormula(element.textContent ?? '') }
      },
    }],
    toDOM: (mark) => ['span', sourceTokenAttrs('nano-math', {
      'data-formula': mark.attrs.formula,
      'data-label': mark.attrs.formula,
      title: mark.attrs.formula,
    }), 0],
  },
  [nanoMarkNames.footnoteRef]: {
    attrs: { name: {} },
    inclusive: false,
    parseDOM: [{
      tag: 'span.nano-footnote-ref',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        return { name: footnoteName(element.dataset.name ?? element.textContent ?? '') }
      },
    }],
    toDOM: (mark) => {
      const name = footnoteName(String(mark.attrs.name ?? '')) || '1'
      return ['span', sourceTokenAttrs('nano-footnote-ref', {
        'data-name': name,
        'data-label': name,
        title: name,
      }), 0]
    },
  },
}
