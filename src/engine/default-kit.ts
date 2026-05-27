import { defaultBlockCapabilities } from '../blocks/nano-block-options'
import { createNanoEditorKit, defaultNanoViewFeatures } from './editor-kit'

export const defaultNanoEditorKit = createNanoEditorKit({
  id: 'nano.default',
  capabilities: defaultBlockCapabilities,
  viewFeatures: defaultNanoViewFeatures,
})
