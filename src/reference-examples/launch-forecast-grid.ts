import { createReferenceView, type ReferenceViewHandle } from './reference-view'

export type LaunchForecastGridReferenceHandle = ReferenceViewHandle

export function createLaunchForecastGridReference(mount: HTMLElement): LaunchForecastGridReferenceHandle {
  return createReferenceView(mount, `# Launch Forecast

| Workstream | Confidence | Risk | Next edit |
| --- | ---: | --- | --- |
| Document engine | 90% | Low | Verify patches |
| ProseMirror adapter | 75% | Medium | Isolate provider |
| Reference demo | 60% | Medium | Reduce chrome |

- [ ] Update confidence after browser pass
- [ ] Mark blocked rows in-place`)
}
