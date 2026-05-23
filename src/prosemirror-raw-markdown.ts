import type { DOMOutputSpec } from 'prosemirror-model'
import {
  isEscapedRawMarkdownToken,
  nextRawMarkdownTokenIndex,
  rawMarkdownTokenDomSpecAt,
} from './prosemirror-raw-markdown-token'

type DOMOutputChild = DOMOutputSpec | string

export function rawMarkdownInlineDomSpec(text: string): DOMOutputChild[] {
  const specs: DOMOutputChild[] = []
  let index = 0

  const appendText = (value: string) => {
    if (value) specs.push(value)
  }

  while (index < text.length) {
    if (isEscapedRawMarkdownToken(text, index)) {
      const nextToken = nextRawMarkdownTokenIndex(text, index + 1)
      appendText(text.slice(index, nextToken))
      index = nextToken
      continue
    }

    const token = rawMarkdownTokenDomSpecAt(text, index)
    if (token) {
      specs.push(token.spec)
      index = token.to
      continue
    }

    const nextToken = nextRawMarkdownTokenIndex(text, index + 1)
    appendText(text.slice(index, nextToken))
    index = nextToken
  }

  return specs
}
