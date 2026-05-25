import { nanoDocumentIndex, nanoDocumentSearch } from '../indexing/nano-document-index'
import { activeBlockId } from './nano-view-active-block'
import type { NanoViewContext } from './nano-view-context'
import {
  indexEntryBlockIds,
  type IndexSectionView,
} from './nano-view-index'
import type { NanoInspectorNavigation } from './nano-view-inspector-navigation'
import { inspectorIndexSections } from './nano-view-inspector-index-sections'
import { indexEntryButton } from './nano-view-inspector-index-entry'

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
