import type { BlockOption, EditorCapability } from './capability'

export function blockOptionsFromCapabilities(
  capabilities: readonly EditorCapability[],
): readonly BlockOption[] {
  return capabilities.flatMap((capability) => capability.blockOptions ?? [])
}
