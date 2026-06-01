import {
  createInteractionActions,
  createInteractionRouter,
  detectInteractionPlatform,
  type InteractionKeyTargetKind,
  shellOwner,
  temporaryControl,
} from '@interactive-os/interaction/runtime'

export interface NanoCommandInteraction {
  activateCommandPalette: () => void
  destroy: () => void
  handleCommandPaletteKeydown: (
    event: KeyboardEvent,
    actions: {
      close: () => void
      move: (delta: number) => void
      runSelected: () => void
    },
  ) => void
  handleGlobalKeydown: (event: KeyboardEvent, openGlobalPalette: () => void) => void
  releaseCommandPalette: () => void
}

const commandPaletteOwnerId = 'nano.command-palette'
const commandPaletteTargetKinds = ['text-input', 'unknown'] satisfies readonly InteractionKeyTargetKind[]
const shellTargetKinds = [
  'pattern',
  'temporary-control',
  'text-input',
  'textarea',
  'contenteditable',
  'native-control',
  'scroll-container',
  'incidental',
  'unknown',
] satisfies readonly InteractionKeyTargetKind[]

type NanoCommandInteractionActions = {
  'nano.command-palette.close': void
  'nano.command-palette.move': { delta: number }
  'nano.command-palette.open': void
  'nano.command-palette.run': void
}

const commandActions = createInteractionActions<NanoCommandInteractionActions>()

export function createNanoCommandInteraction(): NanoCommandInteraction {
  const router = createInteractionRouter({
    platform: detectInteractionPlatform() ?? 'mac',
  })
  const unregisterShell = router.register(shellOwner<NanoCommandInteractionActions>({
    id: 'nano.shell',
    allowNativeText: true,
    allowNativeControl: true,
    stopPropagation: true,
    keys: [
      shellOpenCommandBinding('k'),
      shellOpenCommandBinding('K'),
    ],
  }))
  const unregisterCommandPalette = router.register(temporaryControl<NanoCommandInteractionActions>({
    id: commandPaletteOwnerId,
    targetKinds: commandPaletteTargetKinds,
    restore: [{ key: 'Escape', action: 'nano.command-palette.close' }],
    keys: [
      { key: 'ArrowDown', action: { type: 'nano.command-palette.move', params: { delta: 1 } } },
      { key: 'Tab', action: { type: 'nano.command-palette.move', params: { delta: 1 } } },
      { key: 'ArrowUp', action: { type: 'nano.command-palette.move', params: { delta: -1 } } },
      {
        key: 'Tab',
        modifiers: ['Shift'],
        action: { type: 'nano.command-palette.move', params: { delta: -1 } },
      },
      { key: 'Enter', action: 'nano.command-palette.run' },
    ],
  }))

  return {
    activateCommandPalette: () => {
      router.activate(commandPaletteOwnerId)
    },
    destroy: () => {
      unregisterCommandPalette()
      unregisterShell()
    },
    handleCommandPaletteKeydown: (event, actions) => {
      router.handleEvent(event, {
        onOwnerKey: ({ route }) => {
          const move = commandActions.getRoute(route, 'nano.command-palette.move')
          if (move) {
            actions.move(move.params.delta)
            return
          }
          if (commandActions.getRoute(route, 'nano.command-palette.run')) actions.runSelected()
        },
        onRestoreKey: ({ route }) => {
          if (commandActions.getRoute(route, 'nano.command-palette.close')) actions.close()
        },
      })
    },
    handleGlobalKeydown: (event, openGlobalPalette) => {
      router.handleEvent(event, {
        onOwnerKey: ({ route }) => {
          if (commandActions.getRoute(route, 'nano.command-palette.open')) openGlobalPalette()
        },
      })
    },
    releaseCommandPalette: () => {
      if (router.registry.snapshot().activeOwnerId === commandPaletteOwnerId) {
        router.release(commandPaletteOwnerId, 'cancel')
      }
    },
  }
}

function shellOpenCommandBinding(key: 'k' | 'K') {
  return {
    key,
    mod: 'primary',
    targetKinds: shellTargetKinds,
    action: 'nano.command-palette.open',
  } as const
}
