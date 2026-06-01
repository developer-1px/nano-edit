import {
  replaceInlineEditText,
  restoreInlineEditFocus,
} from '../inline-edit/index'

export interface InlineAutocompleteTrigger<TMode extends string = string> {
  mode: TMode
  trigger: string
  /**
   * Allow spaces inside the query. Token triggers like "@" or "/" match a
   * single whitespace-delimited word (default). Search triggers like "[[" for
   * wiki links or "@" for page mentions may need multi-word queries; set this
   * to keep the match alive across spaces (still closed by a line break).
   */
  allowSpaces?: boolean
}

export interface InlineAutocompleteContext<TMode extends string = string> {
  mode: TMode
  offset: number
  trigger: string
}

export interface InlineAutocompleteMatch<TMode extends string = string> {
  context: InlineAutocompleteContext<TMode>
  query: string
  replaceFrom: number
  replaceTo: number
}

export interface InlineAutocompleteInsertOptions {
  suffix?: string
}

/**
 * Builds a context from a single trigger input such as "@" or "/".
 * For full editor text and query replacement, prefer inlineAutocompleteMatchFromText.
 */
export function inlineAutocompleteContextFromInput<TMode extends string>(
  data: string | null,
  offset: number,
  triggers: readonly InlineAutocompleteTrigger<TMode>[],
): InlineAutocompleteContext<TMode> | null {
  if (data === null) return null
  return inlineAutocompleteContextFromTrigger(data, offset, triggers)
}

export function inlineAutocompleteContextFromMode<TMode extends string>(
  mode: TMode,
  offset: number,
  triggers: readonly InlineAutocompleteTrigger<TMode>[],
): InlineAutocompleteContext<TMode> | null {
  const trigger = triggers.find((candidate) => candidate.mode === mode)
  return trigger ? inlineAutocompleteContext(trigger, offset) : null
}

export function inlineAutocompleteContextFromTrigger<TMode extends string>(
  triggerText: string,
  offset: number,
  triggers: readonly InlineAutocompleteTrigger<TMode>[],
): InlineAutocompleteContext<TMode> | null {
  const trigger = triggers.find((candidate) => candidate.trigger === triggerText)
  return trigger ? inlineAutocompleteContext(trigger, offset) : null
}

export function inlineAutocompleteMatchFromText<TMode extends string>(
  text: string,
  offset: number,
  triggers: readonly InlineAutocompleteTrigger<TMode>[],
): InlineAutocompleteMatch<TMode> | null {
  const cursor = Math.max(0, Math.min(offset, text.length))
  const prefix = text.slice(0, cursor)
  const triggerMatch = nearestInlineAutocompleteTrigger(prefix, triggers)
  if (!triggerMatch) return null

  const queryFrom = triggerMatch.index + triggerMatch.trigger.trigger.length
  const query = text.slice(queryFrom, cursor)
  const breaksQuery = triggerMatch.trigger.allowSpaces ? /[\n\r]/ : /\s/
  if (breaksQuery.test(query)) return null

  return {
    context: inlineAutocompleteContext(triggerMatch.trigger, triggerMatch.index),
    query,
    replaceFrom: triggerMatch.index,
    replaceTo: cursor,
  }
}

export function inlineAutocompleteInsertedText(
  text: string,
  options: InlineAutocompleteInsertOptions = {},
): string {
  return `${text}${options.suffix ?? ' '}`
}

export function insertInlineAutocompleteText(
  editor: HTMLElement,
  text: string,
  offset: number,
  options: InlineAutocompleteInsertOptions = {},
): void {
  const insertedText = inlineAutocompleteInsertedText(text, options)
  replaceInlineEditText(editor, offset, offset, insertedText)
  restoreInlineEditFocus(() => editor, offset + insertedText.length)
}

export function replaceInlineAutocompleteText<TMode extends string>(
  editor: HTMLElement,
  match: InlineAutocompleteMatch<TMode>,
  text: string,
  options: InlineAutocompleteInsertOptions = {},
): void {
  const insertedText = inlineAutocompleteInsertedText(text, options)
  replaceInlineEditText(editor, match.replaceFrom, match.replaceTo, insertedText)
  restoreInlineEditFocus(() => editor, match.replaceFrom + insertedText.length)
}

function inlineAutocompleteContext<TMode extends string>(
  trigger: InlineAutocompleteTrigger<TMode>,
  offset: number,
): InlineAutocompleteContext<TMode> {
  return {
    mode: trigger.mode,
    offset,
    trigger: trigger.trigger,
  }
}

function nearestInlineAutocompleteTrigger<TMode extends string>(
  text: string,
  triggers: readonly InlineAutocompleteTrigger<TMode>[],
): { index: number, trigger: InlineAutocompleteTrigger<TMode> } | null {
  let nearest: { index: number, trigger: InlineAutocompleteTrigger<TMode> } | null = null

  for (const trigger of triggers) {
    const index = text.lastIndexOf(trigger.trigger)
    if (index < 0) continue

    if (
      !nearest
      || index > nearest.index
      || (index === nearest.index && trigger.trigger.length > nearest.trigger.trigger.length)
    ) {
      nearest = { index, trigger }
    }
  }

  return nearest
}
