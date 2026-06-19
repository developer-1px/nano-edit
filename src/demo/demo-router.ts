import {
  BaseRootRoute,
  BaseRoute,
  RouterCore,
  createNonReactiveMutableStore,
  createNonReactiveReadonlyStore,
} from '@tanstack/router-core'
import { defaultDemoArtifactId, validDemoArtifactId } from './artifact-library'

const rootRoute = new BaseRootRoute()
const indexRoute = new BaseRoute({
  getParentRoute: () => rootRoute,
  path: '/',
})
const artifactRoute = new BaseRoute({
  getParentRoute: () => rootRoute,
  path: '/artifacts/$artifactId',
})

const routeTree = rootRoute.addChildren([indexRoute, artifactRoute])

export const demoRouter = new RouterCore({
  routeTree,
  defaultPreload: false,
}, () => ({
  batch: (fn) => fn(),
  createMutableStore: createNonReactiveMutableStore,
  createReadonlyStore: createNonReactiveReadonlyStore,
}))

export function demoArtifactHref(id: string): string {
  return demoRouter.buildLocation({
    to: '/artifacts/$artifactId',
    params: { artifactId: validDemoArtifactId(id) },
  }).href
}

export function artifactIdFromPathname(pathname: string): string | null {
  if (pathname === '/' || pathname === '') return null
  const match = /^\/artifacts\/([^/?#]+)\/?$/.exec(pathname)
  if (!match) return defaultDemoArtifactId
  return validDemoArtifactId(decodeURIComponent(match[1] ?? ''))
}
