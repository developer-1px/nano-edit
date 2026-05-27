import type { EditorCapability } from '../assembly/capability'
import { blockOptionsFromCapabilities } from '../assembly/registry'
import type { BlockOption } from '../blocks/nano-block-options'

export type NanoViewFeatureId =
  | 'active-block-ui'
  | 'source-reveal'
  | 'table-cell-edit'

export interface NanoEditorKit {
  id: string
  blockOptions: readonly BlockOption[]
  viewFeatures: readonly NanoViewFeatureId[]
}

export interface CreateNanoEditorKitOptions {
  id?: string
  capabilities?: readonly EditorCapability[]
  blockOptions?: readonly BlockOption[]
  viewFeatures?: readonly NanoViewFeatureId[]
}

export const defaultNanoViewFeatures = [
  'active-block-ui',
  'source-reveal',
  'table-cell-edit',
] as const satisfies readonly NanoViewFeatureId[]

export function createNanoEditorKit(options: CreateNanoEditorKitOptions = {}): NanoEditorKit {
  return {
    id: options.id ?? 'nano.custom',
    blockOptions: options.blockOptions
      ?? blockOptionsFromCapabilities(options.capabilities ?? []),
    viewFeatures: options.viewFeatures ?? defaultNanoViewFeatures,
  }
}

export function kitHasViewFeature(kit: NanoEditorKit, feature: NanoViewFeatureId): boolean {
  return kit.viewFeatures.includes(feature)
}
