import type { NanoDocument } from '../../entities/document/nano-document-model'
import {
  nano2BasicsDocument,
  nano2DinosDocument,
} from './documents'

export type Nano2ExamplePhase = 'P0' | 'P1' | 'P2' | 'P3'
export type Nano2ExampleStatus = 'ready' | 'planned'

export interface Nano2ExampleDefinition {
  acceptance: string
  document?: NanoDocument
  headless: string
  id: string
  phase: Nano2ExamplePhase
  pressure: string
  sourceHref: string
  status: Nano2ExampleStatus
  title: string
  view: string
}

export const defaultNano2ExampleId = 'basics'

export const nano2Examples: readonly Nano2ExampleDefinition[] = [
  {
    id: 'basics',
    title: 'Basics',
    phase: 'P0',
    status: 'ready',
    sourceHref: 'https://prosemirror.net/examples/basic/',
    pressure: 'Minimal rich text editing, keymaps, block split, marks, heading command, undo, and persistence.',
    headless: 'NanoDocument blocks and marks are validated by Zod and committed through json-document changes/history.',
    view: 'The copied ProseMirror view seed owns DOM input, selection, composition, key dispatch, and browser quirks.',
    acceptance: 'Edit text, split blocks, toggle bold, convert a heading, undo through Nano history, and persist the NanoDocument.',
    document: nano2BasicsDocument,
  },
  {
    id: 'dinos',
    title: 'Dinos in the Document',
    phase: 'P0',
    status: 'ready',
    sourceHref: 'https://prosemirror.net/examples/dino/',
    pressure: 'A custom inline semantic atom that can be selected, copied, pasted, dragged, and deleted as one unit.',
    headless: 'Nano stores the atom as a one-character mention mark with stable id and label attrs.',
    view: 'The view renders the atom as a contenteditable=false chip and parses copied/pasted chip DOM back into Nano data.',
    acceptance: 'Insert a chip with @, arrow through it as one unit, copy/paste it, delete it as one unit, and persist attrs.',
    document: nano2DinosDocument,
  },
  {
    id: 'markdown',
    title: 'Friendly Markdown',
    phase: 'P1',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/markdown/',
    pressure: 'Switch between Markdown text and rendered editing without changing the backend format.',
    headless: 'Markdown is a codec over NanoDocument; NanoDocument remains canonical.',
    view: 'The source and rendered projections must share focus and selection without becoming source of truth.',
    acceptance: 'Edit rendered content, switch to Markdown, edit source, switch back, and compare NanoDocument semantics.',
  },
  {
    id: 'schema',
    title: 'Schema from Scratch',
    phase: 'P1',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/schema/',
    pressure: 'Custom schema families, blocks, inline nodes, marks, wrapping, and insert commands.',
    headless: 'Zod schemas define valid NanoDocument variants before DOM mount.',
    view: 'The view projects valid variants and keeps command application selection-safe.',
    acceptance: 'Reject invalid payloads headlessly, mount valid variants, and run wrap/mark/inline-node commands.',
  },
  {
    id: 'menu',
    title: 'Writing a Menu',
    phase: 'P1',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/menu/',
    pressure: 'Command UI state mirrors whether commands are enabled and active.',
    headless: 'Commands resolve to NanoDocumentChange or selection-only actions independent of button callbacks.',
    view: 'Optional UI renders command state, focuses the editor, and dispatches the same command path as keyboard input.',
    acceptance: 'Run the same command from headless tests, keyboard, and menu with matching enabled/active state.',
  },
  {
    id: 'tooltip',
    title: 'Tooltip',
    phase: 'P2',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/tooltip/',
    pressure: 'Selection-anchored plugin view updated through the editor lifecycle.',
    headless: 'Selection snapshots and derived UI state stay separate from document content.',
    view: 'The view owns coordsAtPos anchoring, overlay updates, and teardown.',
    acceptance: 'Select text, show tooltip, move selection, hide on empty selection, and destroy without document mutation.',
  },
  {
    id: 'upload',
    title: 'Image Upload',
    phase: 'P2',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/upload/',
    pressure: 'Async placeholder maps through edits and is replaced by the final image.',
    headless: 'Pending assets are explicit Nano state or change metadata keyed by stable ids.',
    view: 'The view renders progress, handles completion/failure, and replaces the logical placeholder.',
    acceptance: 'Start upload, edit around the placeholder, complete upload, and verify final image position.',
  },
  {
    id: 'fold',
    title: 'Foldable Nodes',
    phase: 'P2',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/fold/',
    pressure: 'Node view behavior changes with folded state while hidden content remains in the document.',
    headless: 'Fold state is session or document state keyed by Nano node id, not deleted content.',
    view: 'The view hides/shows content DOM, keeps fold chrome, and repairs selection outside hidden content.',
    acceptance: 'Fold a section, keep content unchanged, move selection out, edit nearby blocks, and reload if persistent.',
  },
  {
    id: 'lint',
    title: 'Linter',
    phase: 'P2',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/lint/',
    pressure: 'Derived diagnostics render as decorations with selectable and fixable problems.',
    headless: 'Diagnostics are pure derived data over NanoDocument with optional Nano change fixers.',
    view: 'The view renders decorations/icons and maps clicks to diagnostics and fixes.',
    acceptance: 'Run headless lint, show DOM diagnostics, select one, and apply a narrow NanoDocumentChange fix.',
  },
  {
    id: 'codemirror',
    title: 'Embedded Code Editor',
    phase: 'P3',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/codemirror/',
    pressure: 'A nested code editor syncs content and selection with the outer editor.',
    headless: 'Code text lives at a NanoDocument path and commits narrow text changes.',
    view: 'The nested view owns focus, selection sync, stopEvent behavior, and edge escape keys.',
    acceptance: 'Edit code, undo through Nano history, arrow out at boundaries, and apply external changes to the nested editor.',
  },
  {
    id: 'footnote',
    title: 'Editing Footnotes',
    phase: 'P3',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/footnote/',
    pressure: 'An inline atom opens editable nested content and maps it back to the outer document.',
    headless: 'Footnote reference and body are canonical linked Nano nodes or blocks.',
    view: 'The view opens the nested editor/popover and prevents update loops.',
    acceptance: 'Edit a footnote body, persist it at the footnote path, undo from outer history, and reload the link.',
  },
  {
    id: 'track',
    title: 'Track Changes',
    phase: 'P3',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/track/',
    pressure: 'Commit, inspect blame, and revert individual changes.',
    headless: 'NanoDocumentChange and JSON Patch logs are the change model; blame spans derive from Nano changes.',
    view: 'The view renders change decorations and runs blame/revert UI without exposing ProseMirror steps.',
    acceptance: 'Commit changes, inspect which change introduced text, revert one committed change, and record conflicts.',
  },
  {
    id: 'collab',
    title: 'Collaborative Editing',
    phase: 'P3',
    status: 'planned',
    sourceHref: 'https://prosemirror.net/examples/collab/',
    pressure: 'Shared document editing with synced changes and annotations.',
    headless: 'A collaboration adapter exchanges NanoDocumentChange, revisions, peer ids, selections, and annotations.',
    view: 'The view applies remote changes without stealing local selection unless requested and renders annotations.',
    acceptance: 'Two Nano engines converge after ordered, repeated, and late-join changes.',
  },
]

export function nano2ExampleById(id: string | null): Nano2ExampleDefinition {
  return nano2Examples.find((example) => example.id === id)
    ?? nano2Examples.find((example) => example.id === defaultNano2ExampleId)
    ?? nano2Examples[0]!
}

export function validNano2ExampleId(id: string | null): string {
  return nano2Examples.some((example) => example.id === id)
    ? id!
    : defaultNano2ExampleId
}
