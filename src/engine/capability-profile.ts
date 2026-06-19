import type { NanoViewFeatureId } from './view-features.js';
import { createNanoEditorKitFromCapabilityProfile } from './capability-profile-kit.js';
export type NanoCapabilityProfileId = 'basic' | 'todo';
export interface NanoCapabilityProfileOptions {
    id?: string;
    capabilities?: readonly NanoCapabilityProfileId[];
    viewFeatures?: readonly NanoViewFeatureId[];
}
export interface NanoCapabilityProfileSummary {
    id: string;
    capabilityIds: readonly NanoCapabilityProfileId[];
    blockOptionIds: readonly string[];
    viewFeatures: readonly NanoViewFeatureId[];
}
export const defaultNanoCapabilityProfileIds: readonly NanoCapabilityProfileId[] = [
    'basic',
    'todo',
];
export function describeNanoCapabilityProfile(
    options: NanoCapabilityProfileOptions = {},
): NanoCapabilityProfileSummary {
    const kit = createNanoEditorKitFromCapabilityProfile(options);
    return {
        id: kit.id,
        capabilityIds: capabilityProfileIds(options),
        blockOptionIds: kit.blockOptions.map((option) => option.id),
        viewFeatures: kit.viewFeatures,
    };
}
function capabilityProfileIds(options: NanoCapabilityProfileOptions): readonly NanoCapabilityProfileId[] {
    return options.capabilities ?? defaultNanoCapabilityProfileIds;
}
