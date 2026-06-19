import {
  BaseRootRoute,
  BaseRoute,
  RouterCore,
  createNonReactiveMutableStore,
  createNonReactiveReadonlyStore,
} from '@tanstack/router-core'
import {
  defaultNano2ExampleId,
  validNano2ExampleId,
} from './registry'

const rootRoute = new BaseRootRoute()
const indexRoute = new BaseRoute({
  getParentRoute: () => rootRoute,
  path: '/nano2',
})
const exampleRoute = new BaseRoute({
  getParentRoute: () => rootRoute,
  path: '/nano2/$exampleId',
})

const routeTree = rootRoute.addChildren([indexRoute, exampleRoute])

export const nano2ExamplesRouter = new RouterCore({
  routeTree,
  defaultPreload: false,
}, () => ({
  batch: (fn) => fn(),
  createMutableStore: createNonReactiveMutableStore,
  createReadonlyStore: createNonReactiveReadonlyStore,
}))

export function nano2ExampleHref(id: string): string {
  return nano2ExamplesRouter.buildLocation({
    to: '/nano2/$exampleId',
    params: { exampleId: validNano2ExampleId(id) },
  }).href
}

export function nano2ExampleIdFromPathname(pathname: string): string | null {
  if (pathname === '/nano2' || pathname === '/nano2/') return null
  if (pathname === '/artifacts/nano2' || pathname === '/artifacts/nano2/') return defaultNano2ExampleId

  const match = /^\/nano2\/([^/?#]+)\/?$/.exec(pathname)
  if (!match) return defaultNano2ExampleId
  return validNano2ExampleId(decodeURIComponent(match[1] ?? ''))
}

export function isNano2ExamplesPath(pathname: string): boolean {
  return pathname === '/nano2'
    || pathname === '/nano2/'
    || pathname.startsWith('/nano2/')
    || pathname === '/artifacts/nano2'
    || pathname === '/artifacts/nano2/'
}
