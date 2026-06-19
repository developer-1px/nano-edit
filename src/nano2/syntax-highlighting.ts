import { common, createLowlight } from 'lowlight'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'

export interface Nano2SyntaxToken {
  className: string
  from: number
  to: number
}

interface LowlightElementNode {
  children: LowlightNode[]
  properties: {
    className?: unknown
  }
  type: 'element'
}

interface LowlightRootNode {
  children: LowlightNode[]
  type: 'root'
}

interface LowlightTextNode {
  type: 'text'
  value: string
}

type LowlightNode = LowlightElementNode | LowlightRootNode | LowlightTextNode

const lowlight = createLowlight(common)

export function nano2SyntaxHighlightPlugin(): Plugin {
  return new Plugin({
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        state.doc.descendants((node, position) => {
          if (node.type.name !== nanoNodeNames.codeBlock) return

          for (const token of nano2SyntaxHighlightTokens(node.textContent, codeBlockLanguage(node))) {
            decorations.push(Decoration.inline(
              position + 1 + token.from,
              position + 1 + token.to,
              { class: token.className },
            ))
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}

export function nano2SyntaxHighlightTokens(code: string, language: string | null): Nano2SyntaxToken[] {
  const tree = lowlightTree(code, language)
  const tokens: Nano2SyntaxToken[] = []
  collectSyntaxTokens(tree.children, 0, [], tokens)
  return tokens.filter((token) => token.from < token.to)
}

function lowlightTree(code: string, language: string | null): LowlightRootNode {
  if (language && lowlight.registered(language)) {
    return lowlight.highlight(language, code) as LowlightRootNode
  }

  return lowlight.highlightAuto(code) as LowlightRootNode
}

function collectSyntaxTokens(
  nodes: readonly LowlightNode[],
  offset: number,
  classes: readonly string[],
  tokens: Nano2SyntaxToken[],
): number {
  let cursor = offset

  for (const node of nodes) {
    if (node.type === 'text') {
      const next = cursor + node.value.length
      if (classes.length > 0) {
        tokens.push({
          className: ['nano2-syntax-token', ...classes].join(' '),
          from: cursor,
          to: next,
        })
      }
      cursor = next
      continue
    }

    if (node.type !== 'element') continue

    cursor = collectSyntaxTokens(
      node.children,
      cursor,
      [...classes, ...syntaxClasses(node)],
      tokens,
    )
  }

  return cursor
}

function syntaxClasses(node: LowlightElementNode): string[] {
  const className = node.properties.className
  if (!Array.isArray(className)) return []
  return className
    .filter((value): value is string => typeof value === 'string' && value.startsWith('hljs-'))
}

function codeBlockLanguage(node: ProseMirrorNode): string | null {
  return typeof node.attrs.language === 'string' && node.attrs.language
    ? node.attrs.language
    : null
}
