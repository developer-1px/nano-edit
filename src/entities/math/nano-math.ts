export interface MathToken {
  from: number
  token: string
  formula: string
  to: number
}

export function inlineMathFormula(source: string): string {
  const formula = mathFormula(source, '$')
  return formula && !/[\n\r]/.test(formula) ? formula : ''
}

export function blockMathFormula(source: string): string {
  return mathFormula(source, '$$')
}

export function inlineMathTokenAt(source: string, from: number): MathToken | null {
  if (source[from] !== '$' || source[from + 1] === '$' || source[from - 1] === '$') return null

  const closeFrom = inlineMathCloseFrom(source, from + 1)
  if (closeFrom <= from + 1) return null

  const token = source.slice(from, closeFrom + 1)
  const formula = inlineMathFormula(token)
  if (!formula) return null

  return { from, token, formula, to: closeFrom + 1 }
}

function mathFormula(source: string, delimiter: '$' | '$$'): string {
  let formula = source.trim().replace(/\r\n?/g, '\n')
  if (formula.startsWith(delimiter) && formula.endsWith(delimiter)) {
    formula = formula.slice(delimiter.length, -delimiter.length)
  }

  return formula.trim()
}

function inlineMathCloseFrom(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] !== '$') continue
    if (source[index - 1] === '\\' || source[index + 1] === '$') continue
    return index
  }

  return -1
}
