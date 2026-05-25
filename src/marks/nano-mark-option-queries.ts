import { markOptions } from './nano-mark-option-definitions'
import type {
  MarkCommandEntry,
  MarkKeyBindingEntry,
  MarkOption,
} from './nano-mark-types'

export function markCommandOptions(): MarkCommandEntry[] {
  return markOptions.filter((option): option is MarkCommandEntry => option.command !== undefined)
}

export function markKeyBindingEntries(): MarkKeyBindingEntry[] {
  return markOptions.flatMap((option) =>
    (option.keyBindings ?? []).map((keyBinding) => ({ option, keyBinding })),
  )
}

export function markOptionForInputType(inputType: string): MarkOption | null {
  return markOptions.find((option) => option.inputTypes?.includes(inputType)) ?? null
}
