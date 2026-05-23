import type { EditorState } from 'prosemirror-state'
import {
  blockOptions,
  type BlockTemplate,
  type BlockOption,
} from './nano-block-options'
import {
  blockOptionIdForBlockId,
  type GutterPickerAction,
} from './nano-block-ui'
import type { MoveDirection } from './nano-command-surface'
import { activeBlockId } from './nano-view-active-block'
import type { NanoViewContext } from './nano-view-context'
import {
  changeBlockByIdTransaction,
  insertBlockAfterIdTransaction,
} from './nano-view-block-edit-transactions'
import {
  deleteGutterPickerTypeahead,
  selectAdjacentGutterOption,
  selectGutterOptionByTypeahead,
  selectedGutterOption,
} from './nano-view-gutter-picker-selection'

export interface NanoGutterPickerRuntime {
  closeGutterPicker: (refresh?: boolean) => void
  deleteGutterPickerTypeahead: () => void
  handleBlockInsertOptionClick: (event: MouseEvent, optionButton: HTMLElement) => void
  openGutterPicker: (id: string, action: GutterPickerAction) => void
  refreshBlockUi: () => void
  runGutterPickerAction: (id: string, template: BlockTemplate, action: GutterPickerAction) => boolean
  selectAdjacentGutterOption: (direction: MoveDirection) => void
  selectGutterOptionByTypeahead: (key: string) => void
  selectedGutterOption: () => BlockOption | null
  syncGutterPickerWithSelection: (state: EditorState) => void
}

export function createNanoGutterPickerRuntime(ctx: NanoViewContext): NanoGutterPickerRuntime {
  const refreshBlockUi = (): void => {
    ctx.view.dispatch(ctx.view.state.tr.setMeta('ui', 'block-ui'))
  }

  const closeGutterPicker = (refresh = true): void => {
    if (!ctx.gutterPickerAction && !ctx.gutterPickerBlockId && !ctx.gutterPickerOptionId) return
    ctx.gutterPickerAction = null
    ctx.gutterPickerBlockId = null
    ctx.gutterPickerOptionId = null
    ctx.gutterPickerTypeahead = ''
    ctx.gutterPickerTypeaheadAt = 0
    if (refresh) refreshBlockUi()
  }

  const runGutterPickerAction = (id: string, template: BlockTemplate, action: GutterPickerAction): boolean => {
    const transaction = action === 'change'
      ? changeBlockByIdTransaction(ctx.view.state, id, template)
      : insertBlockAfterIdTransaction(ctx.view.state, id, template)
    if (!transaction) return false

    closeGutterPicker(false)
    ctx.view.dispatch(transaction.scrollIntoView())
    ctx.view.focus()
    return true
  }

  const openGutterPicker = (id: string, action: GutterPickerAction): void => {
    ctx.gutterPickerAction = action
    ctx.gutterPickerBlockId = id
    ctx.gutterPickerOptionId = action === 'change'
      ? blockOptionIdForBlockId(ctx.view.state.doc, id) ?? blockOptions[0]?.id ?? null
      : blockOptions[0]?.id ?? null
    ctx.gutterPickerTypeahead = ''
    ctx.gutterPickerTypeaheadAt = 0
    refreshBlockUi()
  }

  const syncGutterPickerWithSelection = (state: EditorState): void => {
    if (!ctx.gutterPickerBlockId) return
    if (activeBlockId(state) !== ctx.gutterPickerBlockId) closeGutterPicker(false)
  }

  const handleBlockInsertOptionClick = (event: MouseEvent, optionButton: HTMLElement): void => {
    const blockId = optionButton.dataset.blockId
    const optionId = optionButton.dataset.optionId
    const action = optionButton.dataset.action as GutterPickerAction | undefined
    const option = blockOptions.find((candidate) => candidate.id === optionId)
    if (!blockId || !option || !action) return

    event.preventDefault()
    runGutterPickerAction(blockId, option.template, action)
  }

  return {
    closeGutterPicker,
    deleteGutterPickerTypeahead: () => deleteGutterPickerTypeahead(ctx, refreshBlockUi),
    handleBlockInsertOptionClick,
    openGutterPicker,
    refreshBlockUi,
    runGutterPickerAction,
    selectAdjacentGutterOption: (direction) => selectAdjacentGutterOption(ctx, direction, refreshBlockUi),
    selectGutterOptionByTypeahead: (key) => selectGutterOptionByTypeahead(ctx, key, refreshBlockUi),
    selectedGutterOption: () => selectedGutterOption(ctx),
    syncGutterPickerWithSelection,
  }
}
