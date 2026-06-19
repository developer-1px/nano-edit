import {
  blockOptionsFromCapabilities,
  type BlockOption,
  type EditorCapability,
} from '../assembly/capability'
import {
  defaultNanoViewFeatures,
  type NanoViewFeatureId,
} from './view-features'
export type { NanoViewFeatureId } from './view-features'

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

export { defaultNanoViewFeatures } from './view-features'

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
