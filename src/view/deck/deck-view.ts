import { createCollection } from '@interactive-os/json-document-collection'
import type { Pointer } from '@interactive-os/json-document'
import { createNanoDocument, type NanoDocumentEngine } from '../../entities/document/nano-document'
import type { NanoBlock, NanoDocument } from '../../entities/document/nano-document-model'
import type { NanoDeckEngine } from '../../entities/deck/nano-deck'
import type { NanoSlide, NanoSlideRegion } from '../../entities/deck/nano-deck-model'
import type { NanoCapabilityProfileOptions } from '../../engine/capability-profile'
import {
  createNanoDeckRailInteraction,
  type DeckRailReorderDirection,
} from './deck-rail-interaction'
import { createNanoView } from '../runtime/create'
import type { NanoViewHandle } from '../runtime/types'

export interface NanoDeckViewOptions {
  engine: NanoDeckEngine
  capabilityProfile?: NanoCapabilityProfileOptions
  mount: HTMLElement
  onActiveSlideChange?: (change: NanoDeckActiveSlideChange) => void
}

export type NanoDeckActiveSlideChangeReason = 'initial' | 'reorder' | 'select'

export interface NanoDeckActiveSlideChange {
  index: number
  reason: NanoDeckActiveSlideChangeReason
  slideId: string
  title: string
}

export interface NanoDeckViewHandle {
  destroy(): void
}

export function createNanoDeckView(options: NanoDeckViewOptions): NanoDeckViewHandle {
  let activeSlideIndex = 0
  let activeDocumentEngine: NanoDocumentEngine | null = null
  let activeDocumentUnsubscribe: (() => void) | null = null
  let activeNotesEngine: NanoDocumentEngine | null = null
  let activeNotesUnsubscribe: (() => void) | null = null
  let activeNotesView: NanoViewHandle | null = null
  let activeView: NanoViewHandle | null = null
  const railInteraction = createNanoDeckRailInteraction()
  const slideCollection = createCollection(options.engine)

  const root = document.createElement('section')
  root.className = 'nano-deck'

  const rail = document.createElement('nav')
  rail.className = 'nano-deck-rail'
  rail.ariaLabel = 'Slides'
  rail.setAttribute('role', 'listbox')

  const stage = document.createElement('div')
  stage.className = 'nano-deck-stage'

  const frame = document.createElement('div')
  frame.className = 'nano-deck-frame'

  const editorMount = document.createElement('div')
  editorMount.className = 'nano-deck-editor-mount'

  const notes = document.createElement('aside')
  notes.className = 'nano-deck-notes'
  notes.ariaLabel = 'Speaker notes'

  frame.append(editorMount)
  stage.append(frame, notes)
  root.append(rail, stage)
  options.mount.replaceChildren(root)

  renderRail()
  renderActiveSlide()
  notifyActiveSlideChange('initial')

  return {
    destroy() {
      destroyActiveSlide()
      railInteraction.destroy()
      options.mount.replaceChildren()
    },
  }

  function renderRail(): void {
    rail.replaceChildren(...options.engine.value.slides.map((slide, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'nano-deck-slide-button'
      button.dataset.slideIndex = String(index)
      button.dataset.active = String(index === activeSlideIndex)
      button.setAttribute('aria-label', `Slide ${index + 1}`)
      button.setAttribute('aria-selected', String(index === activeSlideIndex))
      button.setAttribute('role', 'option')
      button.tabIndex = index === activeSlideIndex ? 0 : -1
      if (index === activeSlideIndex) button.setAttribute('aria-current', 'page')

      const number = document.createElement('span')
      number.className = 'nano-deck-slide-number'
      number.textContent = String(index + 1)

      const title = document.createElement('span')
      title.className = 'nano-deck-slide-title'
      title.textContent = slideTitle(slide)

      button.append(number, title)
      button.addEventListener('click', () => selectSlide(index))
      button.addEventListener('keydown', (event) => {
        railInteraction.handleSlideKeydown(event, {
          activeIndex: activeSlideIndex,
          focusSlide,
          reorderSlide,
          selectSlide,
          slideCount: options.engine.value.slides.length,
        })
      })
      return button
    }))
  }

  function reorderSlide(direction: DeckRailReorderDirection): number {
    const sourceIndex = activeSlideIndex
    const result = direction === 'previous'
      ? slideCollection.moveUp(slidePointer(sourceIndex))
      : slideCollection.moveDown(slidePointer(sourceIndex))
    if (!result.ok) return activeSlideIndex

    const targetIndex = direction === 'previous' ? sourceIndex - 1 : sourceIndex + 1
    activeSlideIndex = Math.max(0, Math.min(targetIndex, options.engine.value.slides.length - 1))
    renderRail()
    renderActiveSlide()
    notifyActiveSlideChange('reorder')
    return activeSlideIndex
  }

  function selectSlide(index: number): void {
    if (activeSlideIndex === index) return
    activeSlideIndex = index
    renderRail()
    renderActiveSlide()
    notifyActiveSlideChange('select')
  }

  function notifyActiveSlideChange(reason: NanoDeckActiveSlideChangeReason): void {
    const slide = activeSlide()
    options.onActiveSlideChange?.({
      index: activeSlideIndex,
      reason,
      slideId: slide.id,
      title: slideTitle(slide),
    })
  }

  function focusSlide(index: number): void {
    const slide = rail.querySelector<HTMLElement>(`.nano-deck-slide-button[data-slide-index="${index}"]`)
    slide?.focus()
  }

  function renderActiveSlide(): void {
    destroyActiveSlide()

    const slide = activeSlide()
    activeDocumentEngine = createNanoDocument(documentFromSlide(slide))
    const documentEngine = activeDocumentEngine
    activeDocumentUnsubscribe = documentEngine.subscribe(() => {
      syncActiveSlideFromDocument(documentEngine.value)
      renderRail()
    })
    activeView = createNanoView({
      mount: editorMount,
      engine: activeDocumentEngine,
      capabilityProfile: options.capabilityProfile,
      ariaLabel: `${slideTitle(slide)} slide`,
    })
    renderNotes(activeSlide())
  }

  function destroyActiveSlide(): void {
    activeView?.destroy()
    activeView = null
    activeDocumentUnsubscribe?.()
    activeDocumentUnsubscribe = null
    activeDocumentEngine = null
    activeNotesView?.destroy()
    activeNotesView = null
    activeNotesUnsubscribe?.()
    activeNotesUnsubscribe = null
    activeNotesEngine = null
  }

  function activeSlide(): NanoSlide {
    const slide = options.engine.value.slides[activeSlideIndex] ?? options.engine.value.slides[0]
    if (!slide) throw new Error('Nano deck view requires at least one slide')
    return slide
  }

  function syncActiveSlideFromDocument(document: NanoDocument): void {
    const slide = activeSlide()
    const notesRegion = slide.regions.find((region) => region.kind === 'notes')
    const regions = [
      ...regionsFromDocument(slide.id, document),
      ...(notesRegion ? [notesRegion] : []),
    ]
    options.engine.commit(
      [{ op: 'replace', path: `/slides/${activeSlideIndex}/regions`, value: regions }],
      { label: 'edit slide content' },
    )
  }

  function syncActiveSlideNotesFromDocument(document: NanoDocument): void {
    const slide = activeSlide()
    const notesRegionIndex = slide.regions.findIndex((region) => region.kind === 'notes')
    if (notesRegionIndex < 0) return

    options.engine.commit(
      [{
        op: 'replace',
        path: `/slides/${activeSlideIndex}/regions/${notesRegionIndex}/blocks`,
        value: document.blocks,
      }],
      { label: 'edit speaker notes' },
    )
  }

  function renderNotes(slide: NanoSlide): void {
    const notesRegion = slide.regions.find((region) => region.kind === 'notes')
    notes.hidden = !notesRegion
    notes.replaceChildren()
    if (!notesRegion) return

    const label = document.createElement('div')
    label.className = 'nano-deck-notes-label'
    label.textContent = 'Notes'

    const body = document.createElement('div')
    body.className = 'nano-deck-notes-body'
    activeNotesEngine = createNanoDocument({ blocks: notesRegion.blocks })
    const notesEngine = activeNotesEngine
    activeNotesUnsubscribe = notesEngine.subscribe(() => {
      syncActiveSlideNotesFromDocument(notesEngine.value)
    })
    activeNotesView = createNanoView({
      mount: body,
      engine: notesEngine,
      capabilityProfile: options.capabilityProfile,
      inspector: 'disabled',
      ariaLabel: `${slideTitle(slide)} speaker notes`,
    })

    notes.append(label, body)
  }
}

function documentFromSlide(slide: NanoSlide): NanoDocument {
  const blocks = slide.regions
    .filter((region) => region.kind !== 'notes')
    .flatMap((region) => region.blocks)
  return { blocks: blocks.length > 0 ? blocks : [emptySlideParagraph(slide.id)] }
}

function regionsFromDocument(slideId: string, document: NanoDocument): NanoSlideRegion[] {
  const [firstBlock, ...remainingBlocks] = document.blocks
  if (firstBlock?.type === 'heading') {
    const regions: NanoSlideRegion[] = [{
      id: `${slideId}-title`,
      kind: 'title',
      blocks: [firstBlock],
    }]
    if (remainingBlocks.length > 0) {
      regions.push({
        id: `${slideId}-body`,
        kind: 'body',
        blocks: remainingBlocks,
      })
    }
    return regions
  }

  return [{
    id: `${slideId}-body`,
    kind: 'body',
    blocks: document.blocks.length > 0 ? document.blocks : [emptySlideParagraph(slideId)],
  }]
}

function emptySlideParagraph(slideId: string): NanoBlock {
  return {
    id: `${slideId}-empty`,
    marks: [],
    text: '',
    type: 'paragraph',
  }
}

function slideTitle(slide: NanoSlide): string {
  const titleRegion = slide.regions.find((region) => region.kind === 'title')
  const titleBlock = titleRegion?.blocks[0]
  const title = titleBlock ? blockText(titleBlock).trim() : ''
  return title || 'Untitled slide'
}

function blockText(block: NanoBlock): string {
  if ('text' in block && typeof block.text === 'string') return block.text
  if (block.type === 'table') return block.rows.flat().join(' ')
  if (block.type === 'image') return block.alt ?? block.src
  if (block.type === 'attachment') return block.label ?? block.src
  if (block.type === 'bookmark') return block.label ?? block.href
  if (block.type === 'note_ref') return block.alias ?? block.target
  if (block.type === 'tag_ref') return block.name
  return ''
}

function slidePointer(index: number): Pointer {
  return `/slides/${index}`
}
