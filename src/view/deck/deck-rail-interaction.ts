import {
  createInteractionActions,
  createInteractionOwner,
  createInteractionRouter,
  type InteractionKeyTargetKind,
} from '@interactive-os/interaction/runtime'

type DeckRailMoveDirection = 'first' | 'last' | 'next' | 'previous'
export type DeckRailReorderDirection = 'next' | 'previous'

type NanoDeckRailInteractionActions = {
  'nano.deck-rail.move': { direction: DeckRailMoveDirection }
  'nano.deck-rail.reorder': { direction: DeckRailReorderDirection }
  'nano.deck-rail.select': void
}

interface DeckRailInteractionActions {
  activeIndex: number
  focusSlide: (index: number) => void
  reorderSlide: (direction: DeckRailReorderDirection) => number
  selectSlide: (index: number) => void
  slideCount: number
}

export interface NanoDeckRailInteraction {
  destroy: () => void
  handleSlideKeydown: (event: KeyboardEvent, actions: DeckRailInteractionActions) => void
}

const deckRailTargetKinds = [
  'native-control',
  'pattern',
  'incidental',
  'unknown',
] satisfies readonly InteractionKeyTargetKind[]

const deckRailActions = createInteractionActions<NanoDeckRailInteractionActions>()

export function createNanoDeckRailInteraction(): NanoDeckRailInteraction {
  const router = createInteractionRouter()
  const unregister = router.register(createInteractionOwner({
    id: 'nano.deck-rail',
    kind: 'pattern',
    runtimeKind: 'pattern',
    diagnostics: {
      label: 'Slide rail',
      role: 'listbox',
    },
    keyRules: [
      railReorderRule('previous', ['ArrowUp', 'ArrowLeft']),
      railReorderRule('next', ['ArrowDown', 'ArrowRight']),
      railMoveRule('previous', ['ArrowUp', 'ArrowLeft']),
      railMoveRule('next', ['ArrowDown', 'ArrowRight']),
      railMoveRule('first', ['Home']),
      railMoveRule('last', ['End']),
      {
        id: 'nano.deck-rail.select',
        kind: 'command',
        keys: ['Enter', ' '],
        targetKinds: deckRailTargetKinds,
        action: { type: 'nano.deck-rail.select' },
        preventDefault: true,
      },
    ],
  }), { active: true })

  return {
    destroy: unregister,
    handleSlideKeydown: (event, actions) => {
      router.handleEvent(event, {
        onOwnerKey: ({ route }) => {
          const reorder = deckRailActions.getRoute(route, 'nano.deck-rail.reorder')
          if (reorder) {
            actions.focusSlide(actions.reorderSlide(reorder.params.direction))
            return
          }

          const move = deckRailActions.getRoute(route, 'nano.deck-rail.move')
          if (move) {
            const index = movedSlideIndex(actions.activeIndex, actions.slideCount, move.params.direction)
            actions.selectSlide(index)
            actions.focusSlide(index)
            return
          }

          if (deckRailActions.getRoute(route, 'nano.deck-rail.select')) {
            actions.selectSlide(slideIndexFromTarget(event.target) ?? actions.activeIndex)
          }
        },
      })
    },
  }
}

function railReorderRule(direction: DeckRailReorderDirection, keys: readonly string[]) {
  return {
    id: `nano.deck-rail.reorder-${direction}`,
    kind: 'command',
    keys,
    modifiers: ['Alt'],
    targetKinds: deckRailTargetKinds,
    action: { type: 'nano.deck-rail.reorder', params: { direction } },
    preventDefault: true,
  } as const
}

function railMoveRule(direction: DeckRailMoveDirection, keys: readonly string[]) {
  return {
    id: `nano.deck-rail.${direction}`,
    kind: 'navigation',
    keys,
    targetKinds: deckRailTargetKinds,
    action: { type: 'nano.deck-rail.move', params: { direction } },
    preventDefault: true,
  } as const
}

function movedSlideIndex(current: number, count: number, direction: DeckRailMoveDirection): number {
  if (count <= 0) return 0
  if (direction === 'first') return 0
  if (direction === 'last') return count - 1
  const delta = direction === 'next' ? 1 : -1
  return Math.min(Math.max(current + delta, 0), count - 1)
}

function slideIndexFromTarget(target: EventTarget | null): number | null {
  const element = target instanceof Element
    ? target
    : target instanceof Node
      ? target.parentElement
      : null
  const slideButton = element?.closest<HTMLElement>('[data-slide-index]')
  const index = Number(slideButton?.dataset.slideIndex)
  return Number.isInteger(index) ? index : null
}
