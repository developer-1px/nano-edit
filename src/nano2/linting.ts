import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import type { NanoDocument, NanoBlock } from '../entities/document/nano-document-model'
import {
  nanoDocumentChangeFromDocuments,
  type NanoDocumentChange,
} from '../entities/document/nano-document-change'

export type Nano2LintRule = 'double-space' | 'repeated-word' | 'typo-teh'
export type Nano2LintSeverity = 'info' | 'warning'

export interface Nano2LintDiagnostic {
  blockId: string
  blockIndex: number
  from: number
  id: string
  message: string
  replacement?: string
  rule: Nano2LintRule
  severity: Nano2LintSeverity
  to: number
}

interface PositionedLintDiagnostic extends Nano2LintDiagnostic {
  positionFrom: number
  positionTo: number
}

export function nano2LintDiagnostics(document: NanoDocument): Nano2LintDiagnostic[] {
  return document.blocks.flatMap((block, blockIndex) => diagnosticsForBlock(block, blockIndex))
}

export function nano2LintFixChange(document: NanoDocument, diagnosticId: string): NanoDocumentChange | null {
  const diagnostic = nano2LintDiagnostics(document).find((candidate) => candidate.id === diagnosticId)
  if (!diagnostic || diagnostic.replacement === undefined) return null

  const block = document.blocks[diagnostic.blockIndex]
  if (!block || block.id !== diagnostic.blockId || !isLintableTextBlock(block)) return null

  const nextText = `${block.text.slice(0, diagnostic.from)}${diagnostic.replacement}${block.text.slice(diagnostic.to)}`
  const nextDocument: NanoDocument = {
    ...document,
    blocks: document.blocks.map((candidate, index) => index === diagnostic.blockIndex
      ? { ...candidate, text: nextText }
      : candidate),
  }

  return nanoDocumentChangeFromDocuments(document, nextDocument, {
    label: `nano2-lint:${diagnostic.rule}`,
    origin: 'nano2-linting',
  })
}

export function nano2LintPlugin(): Plugin {
  return new Plugin({
    props: {
      decorations: (state) => {
        const decorations = positionedDiagnosticsFromDoc(state.doc).map((diagnostic) => Decoration.inline(
          diagnostic.positionFrom,
          diagnostic.positionTo,
          {
            class: `nano2-lint-problem nano2-lint-${diagnostic.severity}`,
            'data-lint-id': diagnostic.id,
            'data-lint-rule': diagnostic.rule,
            title: diagnostic.message,
          },
        ))

        return DecorationSet.create(state.doc, decorations)
      },
      handleClick: (view, _position, event) => {
        const target = event.target instanceof HTMLElement
          ? event.target.closest<HTMLElement>('[data-lint-id]')
          : null
        if (!target) return false

        const diagnostic = positionedDiagnosticsFromDoc(view.state.doc)
          .find((candidate) => candidate.id === target.dataset.lintId)
        if (!diagnostic || diagnostic.replacement === undefined) return false

        const transaction = view.state.tr
          .insertText(diagnostic.replacement, diagnostic.positionFrom, diagnostic.positionTo)
          .setMeta('inputType', `nano2Lint:${diagnostic.rule}`)
        view.dispatch(transaction.scrollIntoView())
        view.focus()
        return true
      },
    },
  })
}

function positionedDiagnosticsFromDoc(doc: ProseMirrorNode): PositionedLintDiagnostic[] {
  const diagnostics: PositionedLintDiagnostic[] = []

  doc.descendants((node, position) => {
    if (!isLintableNode(node)) return

    for (const diagnostic of diagnosticsForText(node.textContent, {
      blockId: typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : `pos-${position}`,
      blockIndex: diagnostics.length,
    })) {
      diagnostics.push({
        ...diagnostic,
        positionFrom: position + 1 + diagnostic.from,
        positionTo: position + 1 + diagnostic.to,
      })
    }
  })

  return diagnostics
}

function diagnosticsForBlock(block: NanoBlock, blockIndex: number): Nano2LintDiagnostic[] {
  if (!isLintableTextBlock(block)) return []
  return diagnosticsForText(block.text, {
    blockId: block.id,
    blockIndex,
  })
}

function diagnosticsForText(
  text: string,
  context: { blockId: string, blockIndex: number },
): Nano2LintDiagnostic[] {
  return [
    ...regexDiagnostics(text, /\bteh\b/gi, context, {
      message: 'Replace "teh" with "the".',
      replacement: 'the',
      rule: 'typo-teh',
      severity: 'warning',
    }),
    ...regexDiagnostics(text, / {2,}/g, context, {
      message: 'Collapse repeated spaces.',
      replacement: ' ',
      rule: 'double-space',
      severity: 'info',
    }),
    ...repeatedWordDiagnostics(text, context),
  ].sort((left, right) => left.from - right.from || left.rule.localeCompare(right.rule))
}

function regexDiagnostics(
  text: string,
  expression: RegExp,
  context: { blockId: string, blockIndex: number },
  rule: {
    message: string
    replacement: string
    rule: Nano2LintRule
    severity: Nano2LintSeverity
  },
): Nano2LintDiagnostic[] {
  const diagnostics: Nano2LintDiagnostic[] = []

  for (const match of text.matchAll(expression)) {
    const from = match.index
    const value = match[0]
    diagnostics.push(lintDiagnostic(context, {
      from,
      message: rule.message,
      replacement: rule.replacement,
      rule: rule.rule,
      severity: rule.severity,
      to: from + value.length,
    }))
  }

  return diagnostics
}

function repeatedWordDiagnostics(
  text: string,
  context: { blockId: string, blockIndex: number },
): Nano2LintDiagnostic[] {
  const diagnostics: Nano2LintDiagnostic[] = []

  for (const match of text.matchAll(/\b([A-Za-z][A-Za-z'-]*)\s+\1\b/gi)) {
    const from = match.index
    const word = match[1] ?? match[0]
    diagnostics.push(lintDiagnostic(context, {
      from,
      message: `Remove repeated "${word}".`,
      replacement: word,
      rule: 'repeated-word',
      severity: 'warning',
      to: from + match[0].length,
    }))
  }

  return diagnostics
}

function lintDiagnostic(
  context: { blockId: string, blockIndex: number },
  diagnostic: Omit<Nano2LintDiagnostic, 'blockId' | 'blockIndex' | 'id'>,
): Nano2LintDiagnostic {
  return {
    ...diagnostic,
    blockId: context.blockId,
    blockIndex: context.blockIndex,
    id: [
      context.blockId,
      diagnostic.rule,
      diagnostic.from,
      diagnostic.to,
    ].join(':'),
  }
}

function isLintableTextBlock(block: NanoBlock): block is NanoBlock & { id: string, text: string } {
  return 'text' in block
    && typeof block.text === 'string'
    && block.type !== 'code'
    && block.type !== 'math'
}

function isLintableNode(node: ProseMirrorNode): boolean {
  return node.isTextblock
    && node.type.name !== nanoNodeNames.codeBlock
    && node.type.name !== nanoNodeNames.mathBlock
}
