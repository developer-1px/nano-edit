import {
  destroyMountedNanoView,
  forgetMountedNanoView,
  rememberMountedNanoView,
} from '../../src/nano-view-mount-registry.ts'
import { assert, test } from './harness.mjs'

function countedHandle() {
  return {
    calls: 0,
    destroy() {
      this.calls += 1
    },
  }
}

test('Nano view mount registry destroys only the current handle for a mount', () => {
  const mount = {}
  const first = countedHandle()
  const second = countedHandle()

  rememberMountedNanoView(mount, first)
  destroyMountedNanoView(mount)
  assert.equal(first.calls, 1)

  rememberMountedNanoView(mount, second)
  forgetMountedNanoView(mount, first)
  destroyMountedNanoView(mount)
  assert.equal(first.calls, 1)
  assert.equal(second.calls, 1)

  forgetMountedNanoView(mount, second)
  destroyMountedNanoView(mount)
  assert.equal(second.calls, 1)
})
