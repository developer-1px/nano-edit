import {
  AtSign,
  Circle,
  CornerDownLeft,
  ExternalLink,
  FilePlus2,
  FileText,
} from 'lucide'
import type { IndexEntry } from './nano-document-index'
import {
  lucideIconElement,
  type IconNode,
} from './nano-icons'
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
  const icon = document.createElement('span')
  const label = document.createElement('span')
  icon.className = 'nano-index-entry-icon'
  icon.append(lucideIconElement(indexEntryIcon(action), 'nano-index-icon'))
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
  appendIndexEntryLabel(button, icon, label, entry)
  button.addEventListener('click', () => runIndexEntryAction(entry, action, ctx, navigation))
  return button
}

function indexEntryIcon(action: IndexEntryAction): IconNode {
  switch (action) {
    case 'tag':
      return AtSign
    case 'note':
      return FileText
    case 'missing-note':
      return FilePlus2
    case 'backlink':
      return CornerDownLeft
    case 'external':
      return ExternalLink
    case 'select':
      return Circle
  }
}

function appendIndexEntryLabel(button: HTMLButtonElement, icon: HTMLElement, label: HTMLElement, entry: IndexEntry): void {
  if (!entry.detail) {
    button.append(icon, label)
    return
  }
  const detail = document.createElement('span')
  detail.className = 'nano-index-entry-detail'
  detail.textContent = entry.detail
  button.append(icon, label, detail)
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
