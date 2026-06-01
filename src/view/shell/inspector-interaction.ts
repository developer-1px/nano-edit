import {
  createInteractionActions,
  createInteractionOwner,
  createInteractionRouter,
  type InteractionKeyTargetKind,
} from '@interactive-os/interaction/runtime'
import type { InspectorTab } from './shell'

type InspectorTabMoveDirection = 'first' | 'last' | 'next' | 'previous'

type NanoInspectorInteractionActions = {
  'nano.inspector-tabs.move': { direction: InspectorTabMoveDirection }
}

interface InspectorTabInteractionActions {
  focusTab: (tab: InspectorTab) => void
  selectedTab: InspectorTab
  setTab: (tab: InspectorTab) => void
}

export interface NanoInspectorTabInteraction {
  destroy: () => void
  handleTabKeydown: (event: KeyboardEvent, actions: InspectorTabInteractionActions) => void
}

const tabTargetKinds = [
  'native-control',
  'pattern',
  'incidental',
  'unknown',
] satisfies readonly InteractionKeyTargetKind[]

const inspectorTabActions = createInteractionActions<NanoInspectorInteractionActions>()

export function createNanoInspectorTabInteraction(): NanoInspectorTabInteraction {
  const router = createInteractionRouter()
  const unregister = router.register(createInteractionOwner({
    id: 'nano.inspector-tabs',
    kind: 'pattern',
    runtimeKind: 'pattern',
    diagnostics: {
      label: 'Inspector tabs',
      role: 'tablist',
    },
    keyRules: [
      tabMoveRule('previous', ['ArrowLeft']),
      tabMoveRule('next', ['ArrowRight']),
      tabMoveRule('first', ['Home']),
      tabMoveRule('last', ['End']),
    ],
  }), { active: true })

  return {
    destroy: unregister,
    handleTabKeydown: (event, actions) => {
      router.handleEvent(event, {
        onOwnerKey: ({ route }) => {
          const move = inspectorTabActions.getRoute(route, 'nano.inspector-tabs.move')
          if (!move) return

          const tab = movedInspectorTab(actions.selectedTab, move.params.direction)
          actions.setTab(tab)
          actions.focusTab(tab)
        },
      })
    },
  }
}

function tabMoveRule(direction: InspectorTabMoveDirection, keys: readonly string[]) {
  return {
    id: `nano.inspector-tabs.${direction}`,
    kind: 'navigation',
    keys,
    targetKinds: tabTargetKinds,
    action: { type: 'nano.inspector-tabs.move', params: { direction } },
    preventDefault: true,
  } as const
}

function movedInspectorTab(current: InspectorTab, direction: InspectorTabMoveDirection): InspectorTab {
  if (direction === 'first') return 'index'
  if (direction === 'last') return 'markdown'
  return current === 'index' ? 'markdown' : 'index'
}
