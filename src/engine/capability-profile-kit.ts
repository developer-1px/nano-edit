// @ts-nocheck
import { basicCapability } from '../capabilities/basic/capability.js';
import { todoCapability } from '../capabilities/todo/capability.js';
import { createNanoEditorKit, defaultNanoViewFeatures, } from './editor-kit.js';
import {} from './capability-profile.js';
const defaultCapabilityProfileIds = [
    'basic',
    'todo',
];
const builtInCapabilities = {
    basic: basicCapability,
    todo: todoCapability,
};
export function createNanoEditorKitFromCapabilityProfile(options = {}) {
    const capabilityIds = capabilityProfileIds(options);
    return createNanoEditorKit({
        id: options.id ?? 'nano.capability-profile',
        capabilities: capabilityIds.map((capabilityId) => builtInCapabilities[capabilityId]),
        viewFeatures: options.viewFeatures ?? defaultNanoViewFeatures,
    });
}
function capabilityProfileIds(options) {
    return options.capabilities ?? defaultCapabilityProfileIds;
}
