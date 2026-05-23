import type { IndexEntry } from './nano-document-index'
import type { NanoViewContext } from './nano-view-context'
import {
  indexEntryBlockIds,
  indexEntrySymbol,
  type IndexEntryAction,
} from './nano-view-index'
import type { NanoInspectorNavigation } from './nano-view-inspector-navigation'
import {
  externalHrefFromMarkdownLink,
  indexEntryTransaction,
  openExternalLink,
} from './nano-view-references'

export function indexEntryButton(
  entry: IndexEntry,
  action: IndexEntryAction,
  activeId: string | null,
  ctx: NanoViewContext,
  navigation: NanoInspectorNavigation,
): HTMLButtonElement {
  const button = document.createElement('button')
  const label = document.createElement('span')
  label.className = 'nano-index-entry-label'
  label.textContent = entry.label
  button.type = 'button'
  button.className = 'nano-index-entry'
  button.title = entry.detail ? `${entry.detail}  ${indexEntryBlockIds(entry).join(', ')}` : indexEntryBlockIds(entry).join(', ')
  button.ariaLabel = entry.detail ? `${entry.label} ${entry.detail}` : `${entry.label} ${button.title}`
  button.dataset.action = action
  button.dataset.active = String(activeId !== null && indexEntryBlockIds(entry).includes(activeId))
  button.dataset.blockId = entry.blockId
  button.dataset.indexSymbol = indexEntrySymbol(action)
  appendIndexEntryLabel(button, label, entry)
  button.addEventListener('click', () => runIndexEntryAction(entry, action, ctx, navigation))
  return button
}

function appendIndexEntryLabel(button: HTMLButtonElement, label: HTMLElement, entry: IndexEntry): void {
  if (!entry.detail) {
    button.append(label)
    return
  }
  const detail = document.createElement('span')
  detail.className = 'nano-index-entry-detail'
  detail.textContent = entry.detail
  button.append(label, detail)
}

function runIndexEntryAction(
  entry: IndexEntry,
  action: IndexEntryAction,
  ctx: NanoViewContext,
  navigation: NanoInspectorNavigation,
): void {
  if (action === 'external') {
    const href = entry.target ?? externalHrefFromMarkdownLink(entry.label)
    if (href) {
      openExternalLink(href)
      ctx.view.focus()
      return
    }
  }

  const transaction = indexEntryTransaction(ctx.view.state, entry, action)
  if (transaction) {
    navigation.dispatchAndReveal(transaction)
    ctx.view.focus()
    return
  }
  navigation.selectBlockById(entry.blockId)
}
