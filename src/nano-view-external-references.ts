export function externalLinkHrefFromEventTarget(target: EventTarget | null): string | null {
  const element = target instanceof Element
    ? target.closest<HTMLElement>('.nano-md-link, .nano-raw-link')
    : null
  if (!element) return null

  return normalizeExternalHref(
    element.getAttribute('href')
      ?? element.dataset.href
      ?? '',
  )
}

export function externalHrefFromMarkdownLink(label: string): string | null {
  const match = /^\[[^\]\n\r]+\]\((.+)\)$/.exec(label.trim())
  return normalizeExternalHref(markdownLinkDestinationHref(match?.[1] ?? '') ?? '')
}

export function openExternalLink(href: string): void {
  window.open(href, '_blank', 'noopener,noreferrer')
}

function normalizeExternalHref(href: string): string | null {
  const normalized = href.trim()
  if (!normalized) return null
  return encodeURI(normalized)
}

function markdownLinkDestinationHref(source: string): string | null {
  const trimmed = source.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('<')) {
    const closeIndex = trimmed.indexOf('>')
    if (closeIndex < 0) return null

    const href = trimmed.slice(1, closeIndex).replace(/\\([\\>])/g, '$1')
    const tail = trimmed.slice(closeIndex + 1).trim()
    if (tail && !/^"(?:\\.|[^"\\])*"$/.test(tail)) return null
    return href
  }

  const match = /^(\S+)(?:\s+"(?:\\.|[^"\\])*")?$/.exec(trimmed)
  return match?.[1] ?? null
}
