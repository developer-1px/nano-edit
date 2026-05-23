import { markOptions } from './nano-mark-option-definitions'
import type {
  MarkKeyBindingEntry,
  MarkOption,
  MarkToolbarEntry,
} from './nano-mark-types'

export function markToolbarOptions(): MarkToolbarEntry[] {
  return markOptions.filter((option): option is MarkToolbarEntry => option.toolbar !== undefined)
}

export function markKeyBindingEntries(): MarkKeyBindingEntry[] {
  return markOptions.flatMap((option) =>
    (option.keyBindings ?? []).map((keyBinding) => ({ option, keyBinding })),
  )
}

export function markOptionForInputType(inputType: string): MarkOption | null {
  return markOptions.find((option) => option.inputTypes?.includes(inputType)) ?? null
}
