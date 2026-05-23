import {
  blockOptions,
  type BlockOption,
} from './nano-block-options'
import {
  blockOptionIdForTypeahead,
  blockOptionsForTypeahead,
} from './nano-block-ui'
import type { MoveDirection } from './nano-command-surface'
import {
  GUTTER_TYPEAHEAD_MS,
  type NanoViewContext,
} from './nano-view-context'

export function selectedGutterOption(ctx: NanoViewContext): BlockOption | null {
  const options = visibleGutterOptions(ctx)
  return options.find((option) => option.id === ctx.gutterPickerOptionId) ?? options[0] ?? null
}

export function selectAdjacentGutterOption(
  ctx: NanoViewContext,
  direction: MoveDirection,
  refreshBlockUi: () => void,
): void {
  const options = visibleGutterOptions(ctx)
  if (options.length === 0) return

  const index = options.findIndex((option) => option.id === ctx.gutterPickerOptionId)
  const baseIndex = index >= 0 ? index : 0
  const nextIndex = direction === 'up'
    ? (baseIndex - 1 + options.length) % options.length
    : (baseIndex + 1) % options.length
  ctx.gutterPickerOptionId = options[nextIndex]?.id ?? null
  refreshBlockUi()
}

export function selectGutterOptionByTypeahead(
  ctx: NanoViewContext,
  key: string,
  refreshBlockUi: () => void,
): void {
  const now = Date.now()
  const query = now - ctx.gutterPickerTypeaheadAt > GUTTER_TYPEAHEAD_MS
    ? key
    : `${ctx.gutterPickerTypeahead}${key}`
  ctx.gutterPickerTypeahead = query
  ctx.gutterPickerTypeaheadAt = now
  ctx.gutterPickerOptionId = blockOptionIdForTypeahead(query)
  refreshBlockUi()
}

export function deleteGutterPickerTypeahead(
  ctx: NanoViewContext,
  refreshBlockUi: () => void,
): void {
  ctx.gutterPickerTypeahead = ctx.gutterPickerTypeahead.slice(0, -1)
  ctx.gutterPickerTypeaheadAt = Date.now()
  ctx.gutterPickerOptionId = ctx.gutterPickerTypeahead
    ? blockOptionIdForTypeahead(ctx.gutterPickerTypeahead)
    : ctx.gutterPickerOptionId ?? blockOptions[0]?.id ?? null
  refreshBlockUi()
}

function visibleGutterOptions(ctx: NanoViewContext): BlockOption[] {
  return blockOptionsForTypeahead(ctx.gutterPickerTypeahead)
}
