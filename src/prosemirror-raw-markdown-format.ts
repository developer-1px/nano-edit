export function rawFormatAt(text: string, from: number): { token: string; content: string; className: string; to: number } | null {
  return rawDelimitedFormatAt(text, from, '**', 'nano-raw-bold')
    ?? rawDelimitedFormatAt(text, from, '__', 'nano-raw-bold')
    ?? rawDelimitedFormatAt(text, from, '~~', 'nano-raw-strike')
    ?? rawDelimitedFormatAt(text, from, '~', 'nano-raw-underline')
    ?? rawDelimitedFormatAt(text, from, '==', 'nano-raw-highlight')
    ?? rawDelimitedFormatAt(text, from, '`', 'nano-raw-code')
    ?? rawItalicAt(text, from)
    ?? rawUnderscoreItalicAt(text, from)
}

function rawDelimitedFormatAt(
  text: string,
  from: number,
  delimiter: string,
  className: string,
): { token: string; content: string; className: string; to: number } | null {
  if (!text.startsWith(delimiter, from)) return null

  const closeFrom = text.indexOf(delimiter, from + delimiter.length)
  if (closeFrom <= from + delimiter.length) return null

  const content = text.slice(from + delimiter.length, closeFrom)
  if (!content.trim()) return null

  return {
    token: text.slice(from, closeFrom + delimiter.length),
    content,
    className,
    to: closeFrom + delimiter.length,
  }
}

function rawItalicAt(text: string, from: number): { token: string; content: string; className: string; to: number } | null {
  if (text[from] !== '*' || text[from - 1] === '*' || text[from + 1] === '*') return null

  for (let index = from + 1; index < text.length; index += 1) {
    if (text[index] !== '*' || text[index - 1] === '*' || text[index + 1] === '*') continue

    const content = text.slice(from + 1, index)
    if (!content.trim()) return null
    return { token: text.slice(from, index + 1), content, className: 'nano-raw-italic', to: index + 1 }
  }

  return null
}

function rawUnderscoreItalicAt(text: string, from: number): { token: string; content: string; className: string; to: number } | null {
  if (text[from] !== '_' || text[from - 1] === '_' || text[from + 1] === '_') return null

  for (let index = from + 1; index < text.length; index += 1) {
    if (text[index] !== '_' || text[index - 1] === '_' || text[index + 1] === '_') continue

    const content = text.slice(from + 1, index)
    if (!content.trim()) return null
    return { token: text.slice(from, index + 1), content, className: 'nano-raw-italic', to: index + 1 }
  }

  return null
}
