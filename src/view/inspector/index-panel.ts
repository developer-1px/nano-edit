import {
  AtSign,
  Circle,
  CornerDownLeft,
  ExternalLink,
  FilePlus2,
  FileText,
} from 'lucide'
import type { EditorState, Transaction } from 'prosemirror-state'
import type { IndexEntry } from '../../indexing/document-index/types'
import { nanoDocumentIndex } from '../../indexing/document-index/build'
import { nanoDocumentSearch } from '../../indexing/search/nano-document-search'
import { activeBlockId } from '../selection/active-block'
import {
  lucideIconElement,
  type IconNode,
} from '../icons'
import type { NanoViewContext } from '../runtime/context'
import {
  indexEntryBlockIds,
  indexEntrySymbol,
  type IndexEntryAction,
  type IndexSectionView,
} from '../index-entry-view'
import type { NanoInspectorNavigation } from './navigation'
import { inspectorIndexSections } from './index-sections'
import { externalHrefFromMarkdownLink, openExternalLink } from '../references/external'
import { noteReferenceTransaction } from '../references/note'
import { tagReferenceTransaction } from '../references/tag'

export function createNanoInspectorIndexRuntime(ctx: NanoViewContext, navigation: NanoInspectorNavigation) {
  const renderIndex = (): void => {
    const index = nanoDocumentIndex(ctx.engine.value)
    const search = nanoDocumentSearch(ctx.engine.value, ctx.indexSearchQuery)
    const searchBlockIds = search ? new Set(search.blockIds) : null
    const activeId = activeBlockId(ctx.view.state)
    const sections = inspectorIndexSections(index)
    const visibleSections = searchBlockIds
      ? sections.map((section) => ({
        ...section,
        entries: section.entries.filter((entry) =>
          indexEntryBlockIds(entry).some((id) => searchBlockIds.has(id)),
        ),
      }))
      : sections
    const renderedSections = visibleSections
      .filter((section) => section.entries.length > 0)
      .map((section) => indexSection(section, activeId, ctx, navigation))

    ctx.indexOutput.replaceChildren(
      ...renderedSections,
      ...(renderedSections.length === 0 ? [indexEmptyState(searchBlockIds)] : []),
    )
  }

  return { renderIndex }
}

function indexEmptyState(searchBlockIds: ReadonlySet<string> | null): HTMLElement {
  const empty = document.createElement('p')
  empty.className = 'nano-index-empty'
  empty.textContent = searchBlockIds ? 'no match' : 'empty'
  return empty
}

function indexSection(
  sectionView: IndexSectionView,
  activeId: string | null,
  ctx: NanoViewContext,
  navigation: NanoInspectorNavigation,
): HTMLElement {
  const section = document.createElement('div')
  section.className = 'nano-index-section'

  const heading = document.createElement('h3')
  heading.textContent = `${sectionView.title} ${sectionView.entries.length}`
  section.append(heading)
  section.append(...sectionView.entries.map((entry) => indexEntryButton(entry, sectionView.action, activeId, ctx, navigation)))
  return section
}

function indexEntryButton(
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

function indexEntryTransaction(
  state: EditorState,
  entry: IndexEntry,
  action: IndexEntryAction,
): Transaction | null {
  if (action === 'note' || action === 'missing-note') return noteReferenceTransaction(state, entry.target ?? entry.label)
  if (action === 'tag') return tagReferenceTransaction(state, entry.target ?? entry.label)
  return null
}
