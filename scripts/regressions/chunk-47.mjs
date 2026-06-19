import {
  applyRemoteNanoDocumentChange,
  blockTextPointer,
  commitNanoDocumentCommand,
  createNanoDocumentInMemoryCollaborationHub,
  createNanoDocumentCollaborationChange,
  createNanoDocument,
  NanoDocumentSchema,
  nanoDocumentChangeFromCommand,
  nanoDocumentChangeConflictPointers,
  nanoDocumentChangeScope,
  nanoDocumentChangeTouchedPointers,
  nanoDocumentChangeTouchesPointer,
  nanoDocumentCollaborationDeliveryKey,
  nanoDocumentCollaborationNumericRevision,
  nanoDocumentCommandLabel,
  nanoDocumentFromMarkdown,
  isNanoDocumentCommand,
  isNanoDocumentChange,
  isNanoDocumentCollaborationChange,
  isOwnNanoDocumentCollaborationChange,
  parseNanoDocumentCommand,
  parseNanoDocumentChange,
  parseNanoDocumentCollaborationChange,
  point,
  receiveNanoDocumentCollaborationChange,
  remoteNanoDocumentChangeOrigin,
  replaceBlocksPatch,
  selectionSnap,
  shouldReceiveNanoDocumentCollaborationChange,
} from '../../src/index.ts'
import {
  nanoBlocksFromProseMirror,
  nanoDocumentChangeFromProseMirrorDoc,
  nanoDocumentFromProseMirror,
  prosemirrorDocFromNano,
  textMergePathForDocuments,
} from '../../src/adapters/prosemirror/prosemirror-document.ts'
import {
  commitNanoDocumentChange,
  nanoDocumentChangeFromDocuments,
  nanoDocumentPatchFromDocuments,
} from '../../src/entities/document/nano-document-change.ts'
import { imageNodeSpec } from '../../src/adapters/prosemirror/prosemirror-image-node-spec.ts'
import { linkMarkSpec } from '../../src/adapters/prosemirror/prosemirror-link-mark-spec.ts'
import { nanoMarkFromProseMirrorMark } from '../../src/adapters/prosemirror/prosemirror-mark-codec-registry.ts'
import { nanoMarkNames } from '../../src/adapters/prosemirror/prosemirror-names.ts'
import { nanoNodeNames } from '../../src/adapters/prosemirror/prosemirror-names.ts'
import { nanoSchema } from '../../src/adapters/prosemirror/prosemirror-schema.ts'
import {
  attachmentNodeSpec,
  bookmarkNodeSpec,
  noteRefNodeSpec,
  tagRefNodeSpec,
} from '../../src/adapters/prosemirror/prosemirror-reference-node-specs.ts'
import { referenceMarkSpecs } from '../../src/adapters/prosemirror/prosemirror-reference-mark-specs.ts'
import { assert, test } from './harness.mjs'

test('ProseMirror to Nano conversion returns a schema-valid document', () => {
  const source = nanoDocumentFromMarkdown([
    '# 현장 기록',
    '',
    '- [ ] 오전 메모 정리',
  ].join('\n'))
  const prosemirrorDoc = prosemirrorDocFromNano(source)
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(NanoDocumentSchema.parse(document), document)
  assert.deepEqual(nanoBlocksFromProseMirror(prosemirrorDoc), document.blocks)
})

test('Nano block patch equality ignores object key order', () => {
  const current = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'Same', marks: [] }],
  }
  const nextBlocks = [{ marks: [], text: 'Same', type: 'paragraph', id: 'b1' }]

  assert.deepEqual(replaceBlocksPatch(current, nextBlocks), [])
})

test('Text merge history ignores unchanged block key order', () => {
  const previous = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'old', marks: [] },
      { id: 'b2', type: 'paragraph', text: 'same', marks: [] },
    ],
  }
  const next = {
    blocks: [
      { marks: [], text: 'new', id: 'b1', type: 'paragraph' },
      { marks: [], text: 'same', type: 'paragraph', id: 'b2' },
    ],
  }

  assert.equal(textMergePathForDocuments(previous, next), '/blocks/0/text')
})

test('Nano Document changes are provider-neutral before provider commit', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }
  const selection = selectionSnap(
    point(blockTextPointer(0), 3),
    point(blockTextPointer(0), 3),
  )
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'insertText',
    origin: 'test-provider',
    selection,
  })

  assert.deepEqual(change, {
    kind: 'nano-document.change',
    label: 'insertText',
    mergePath: '/blocks/0/text',
    operations: [{ op: 'replace', path: '/blocks/0/text', value: 'new' }],
    origin: 'test-provider',
    selection,
  })
  assert.deepEqual(parseNanoDocumentChange(change), change)
  assert.equal(isNanoDocumentChange(change), true)
  assert.equal(parseNanoDocumentChange({ ...change, kind: 'not-a-change' }), null)
  assert.equal(parseNanoDocumentChange({ ...change, providerTransaction: { id: 'pm-tr' } }), null)
  assert.equal(parseNanoDocumentChange({ ...change, label: '' }), null)
  assert.equal(parseNanoDocumentChange({ ...change, origin: '   ' }), null)
  assert.equal(parseNanoDocumentChange({ ...change, operations: [{ op: 'replace', path: '/blocks/0/text', value: 'new', providerStep: 1 }] }), null)
  assert.equal(parseNanoDocumentChange({ ...change, operations: [{ op: 'replace', path: 'blocks/0/text', value: 'bad pointer' }] }), null)
  assert.equal(parseNanoDocumentChange({ ...change, operations: [{ op: 'replace', path: '/blocks/0/text', value: undefined }] }), null)
  assert.equal(parseNanoDocumentChange({ ...change, selection: { ...selection, focus: { path: 'blocks/0/text', offset: 3 } } }), null)
  assert.equal(parseNanoDocumentChange({ ...change, selection: { ...selection, view: 'prosemirror' } }), null)
  assert.throws(
    () => nanoDocumentChangeFromDocuments(previous, next, {
      label: '',
      origin: 'test-provider',
      selection,
    }),
    /change label must not be blank/,
  )
  assert.throws(
    () => nanoDocumentChangeFromDocuments(previous, next, {
      label: 'insertText',
      origin: '   ',
      selection,
    }),
    /change origin must not be blank/,
  )

  const engine = createNanoDocument(previous)
  const committed = commitNanoDocumentChange(engine, change)
  assert.equal(committed.ok, true)
  assert.deepEqual(engine.value, next)
  assert.deepEqual(engine.selection?.snapshot().focus, selection.focus)
})

test('Nano Document commands resolve to canonical change envelopes', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old value', marks: [] }],
  }
  const command = {
    kind: 'nano-document.command.set-text',
    target: { blockId: 'b1' },
    text: 'new',
  }
  const result = nanoDocumentChangeFromCommand(previous, command)

  assert.deepEqual(parseNanoDocumentCommand(command), command)
  assert.equal(isNanoDocumentCommand(command), true)
  assert.equal(parseNanoDocumentCommand({ ...command, kind: 'nano-document.command.unknown' }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, providerCommand: 'setNodeMarkup' }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, label: '' }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, origin: '   ' }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, target: { blockId: 'b1', blockIndex: 0 } }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, target: { blockId: 'b1', providerPos: 1 } }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, target: { blockIndex: -1 } }), null)
  assert.equal(parseNanoDocumentCommand({ ...command, selection: {
    anchor: { path: '/blocks/0/text', offset: 0 },
    focus: { path: 'blocks/0/text', offset: 0 },
    primaryIndex: 0,
    selectedPointers: ['/blocks/0/text'],
    selectionRanges: [],
  } }), null)
  assert.equal(result.ok, true)
  assert.deepEqual(result.change, {
    kind: 'nano-document.change',
    label: 'set-text',
    mergePath: '/blocks/0/text',
    operations: [{ op: 'replace', path: '/blocks/0/text', value: 'new' }],
    origin: 'nano-document-command',
    selection: null,
  })
  assert.equal(nanoDocumentCommandLabel(command), 'set-text')

  const engine = createNanoDocument(previous)
  assert.equal(commitNanoDocumentCommand(engine, command).ok, true)
  assert.deepEqual(engine.value, {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  })
})

test('Nano Document commands cover table cells and block array changes', () => {
  const previous = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'one', marks: [] },
      { id: 'table', type: 'table', rows: [['A', 'B'], ['C', 'D']] },
    ],
  }

  assert.deepEqual(nanoDocumentChangeFromCommand(previous, {
    kind: 'nano-document.command.set-table-cell',
    target: { blockId: 'table' },
    row: 1,
    column: 0,
    text: 'changed',
  }).change?.operations, [
    { op: 'replace', path: '/blocks/1/rows/1/0', value: 'changed' },
  ])

  const inserted = nanoDocumentChangeFromCommand(previous, {
    kind: 'nano-document.command.insert-block',
    at: { afterBlockId: 'b1' },
    block: { id: 'b2', type: 'paragraph', text: 'two', marks: [] },
  })
  assert.equal(inserted.ok, true)
  assert.equal(parseNanoDocumentCommand({
    kind: 'nano-document.command.insert-block',
    at: { afterBlockId: 'b1', index: 1 },
    block: { id: 'b2', type: 'paragraph', text: 'two', marks: [] },
  }), null)
  assert.equal(parseNanoDocumentCommand({
    kind: 'nano-document.command.insert-block',
    at: { index: 1 },
    block: { id: '', type: 'paragraph', text: 'two', marks: [] },
  }), null)
  assert.deepEqual(inserted.change?.operations, [
    { op: 'add', path: '/blocks/1', value: { id: 'b2', type: 'paragraph', text: 'two', marks: [] } },
  ])

  const moved = nanoDocumentChangeFromCommand(previous, {
    kind: 'nano-document.command.move-block',
    target: { blockId: 'b1' },
    to: { afterBlockId: 'table' },
  })
  assert.equal(moved.ok, true)
  assert.deepEqual(moved.change?.operations, [
    { op: 'move', from: '/blocks/0', path: '/blocks/1' },
  ])

  const moveEngine = createNanoDocument(previous)
  assert.equal(commitNanoDocumentCommand(moveEngine, {
    kind: 'nano-document.command.move-block',
    target: { blockId: 'table' },
    to: { beforeBlockId: 'b1' },
  }).ok, true)
  assert.deepEqual(moveEngine.value.blocks.map((block) => block.id), ['table', 'b1'])
  assert.equal(parseNanoDocumentCommand({
    kind: 'nano-document.command.move-block',
    target: { blockId: 'b1' },
    to: { afterBlockId: 'b1', index: 1 },
  }), null)

  const removed = nanoDocumentChangeFromCommand(previous, {
    kind: 'nano-document.command.remove-block',
    target: { blockIndex: 0 },
  })
  assert.equal(removed.ok, true)
  assert.deepEqual(removed.change?.operations, [
    { op: 'remove', path: '/blocks/0' },
  ])
})

test('Nano Document commands report invalid targets before provider work', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'one', marks: [] }],
  }

  assert.deepEqual(nanoDocumentChangeFromCommand(previous, {
    kind: 'nano-document.command.set-text',
    target: { blockId: 'missing' },
    text: 'new',
  }), {
    ok: false,
    code: 'target_not_found',
    reason: 'Nano Document command target was not found: {"blockId":"missing"}',
  })

  assert.equal(nanoDocumentChangeFromCommand(previous, {
    kind: 'nano-document.command.remove-block',
    target: { blockId: 'b1' },
  }).code, 'schema_violation')
})

test('Nano Document collaboration changes apply remote edits without provider state', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }
  const localSelection = selectionSnap(
    point(blockTextPointer(0), 0),
    point(blockTextPointer(0), 0),
  )
  const remoteSelection = selectionSnap(
    point(blockTextPointer(0), 3),
    point(blockTextPointer(0), 3),
  )
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'remote insert',
    origin: 'peer-a',
    selection: remoteSelection,
  })
  const engine = createNanoDocument(previous)
  let observedMetadata = null

  engine.selection?.restore(localSelection)
  const unsubscribe = engine.subscribe((_operations, metadata) => {
    observedMetadata = metadata
  })
  const message = createNanoDocumentCollaborationChange(change, {
    peerId: 'peer-a',
    revision: 2,
  })
  const parsedMessage = parseNanoDocumentCollaborationChange(message)
  assert.notEqual(parsedMessage, null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, providerAwareness: {} }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, peerId: '' }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, peerId: '   ' }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, revision: '' }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, revision: '   ' }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, revision: -1 }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, revision: 1.5 }), null)
  assert.throws(
    () => createNanoDocumentCollaborationChange(change, { peerId: '' }),
    /peer id must not be blank/,
  )
  assert.throws(
    () => createNanoDocumentCollaborationChange(change, { peerId: '   ' }),
    /peer id must not be blank/,
  )
  assert.throws(
    () => createNanoDocumentCollaborationChange(change, { revision: '' }),
    /revision must be a nonnegative integer or non-blank string/,
  )
  assert.throws(
    () => createNanoDocumentCollaborationChange(change, { revision: -1 }),
    /revision must be a nonnegative integer or non-blank string/,
  )
  const result = receiveNanoDocumentCollaborationChange(engine, parsedMessage)
  unsubscribe()

  assert.equal(isNanoDocumentCollaborationChange(message), true)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'unknown', path: '/blocks' }] } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'replace', path: 'blocks/0/text', value: 'not-a-pointer' }] } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'replace', path: '/blocks/~bad', value: 'bad-escape' }] } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'move', from: 'blocks/0/text', path: '/blocks/1/text' }] } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, selection: { ...remoteSelection, focus: { path: 'blocks/0/text', offset: 3 } } } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'replace', path: '/blocks/0/text', value: undefined }] } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'replace', path: '/blocks/0/text', value: Number.NaN }] } }), null)
  assert.equal(parseNanoDocumentCollaborationChange({ ...message, change: { ...message.change, operations: [{ op: 'add', path: '/blocks/1', value: { id: 'b2', render: () => 'not-json' } }] } }), null)
  assert.equal(result.ok, true)
  assert.deepEqual(engine.value, next)
  assert.equal(message.kind, 'nano-document.collaboration-change')
  assert.equal(message.revision, 2)
  assert.equal(nanoDocumentCollaborationDeliveryKey(message), 'peer-a\u0000number:2')
  assert.equal(nanoDocumentCollaborationNumericRevision(message), 2)
  assert.equal(nanoDocumentCollaborationDeliveryKey(createNanoDocumentCollaborationChange(change)), null)
  assert.equal(nanoDocumentCollaborationNumericRevision(createNanoDocumentCollaborationChange(change, {
    peerId: 'peer-a',
    revision: 'r2',
  })), null)
  assert.equal(observedMetadata?.origin, 'remote:peer-a')
  assert.equal(observedMetadata?.label, 'remote insert')
  assert.deepEqual(engine.selection?.snapshot().focus, localSelection.focus)
  assert.equal(remoteNanoDocumentChangeOrigin('peer-a'), 'remote:peer-a')
  assert.equal(remoteNanoDocumentChangeOrigin('remote:peer-a'), 'remote:peer-a')
  assert.throws(
    () => remoteNanoDocumentChangeOrigin(''),
    /remote change origin must not be blank/,
  )
})

test('Nano Document collaboration receive helpers skip local echo by peer id', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'echo insert',
    origin: 'peer-a',
  })
  const message = createNanoDocumentCollaborationChange(change, {
    peerId: 'peer-a',
    revision: 'r1',
  })
  const skippedEngine = createNanoDocument(previous)

  assert.equal(isOwnNanoDocumentCollaborationChange(message, 'peer-a'), true)
  assert.equal(shouldReceiveNanoDocumentCollaborationChange(message, { localPeerId: 'peer-a' }), false)
  assert.equal(receiveNanoDocumentCollaborationChange(skippedEngine, message, { localPeerId: 'peer-a' }).ok, true)
  assert.deepEqual(skippedEngine.value, previous)

  const appliedEngine = createNanoDocument(previous)
  assert.equal(shouldReceiveNanoDocumentCollaborationChange(message, {
    ignoreOwnChanges: false,
    localPeerId: 'peer-a',
  }), true)
  assert.equal(receiveNanoDocumentCollaborationChange(appliedEngine, message, {
    ignoreOwnChanges: false,
    localPeerId: 'peer-a',
  }).ok, true)
  assert.deepEqual(appliedEngine.value, next)
})

test('Nano Document in-memory collaboration hub publishes changes between engines', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'publish insert',
    origin: 'peer-a',
  })
  const localEngine = createNanoDocument(previous)
  const remoteEngine = createNanoDocument(previous)
  const hub = createNanoDocumentInMemoryCollaborationHub()
  const localPeer = hub.connect({ engine: localEngine, peerId: 'peer-a' })
  const remotePeer = hub.connect({ engine: remoteEngine, peerId: 'peer-b' })

  assert.deepEqual(hub.peerIds(), ['peer-a', 'peer-b'])
  assert.throws(
    () => hub.connect({ engine: createNanoDocument(previous), peerId: '' }),
    /peer id must not be blank/,
  )
  assert.throws(
    () => hub.connect({ engine: createNanoDocument(previous), peerId: '   ' }),
    /peer id must not be blank/,
  )
  assert.throws(
    () => hub.connect({ engine: createNanoDocument(previous), peerId: 'peer-a' }),
    /peer already connected: peer-a/,
  )
  assert.throws(
    () => localPeer.publish(change, { revision: -1 }),
    /revision must be a nonnegative integer or non-blank string/,
  )
  assert.equal(commitNanoDocumentChange(localEngine, change).ok, true)
  const dispatch = localPeer.publish(change, { revision: 'r2' })

  assert.equal(dispatch.message.peerId, 'peer-a')
  assert.equal(dispatch.message.revision, 'r2')
  assert.deepEqual(dispatch.results.map((entry) => [entry.peerId, entry.result.ok]), [
    ['peer-a', true],
    ['peer-b', true],
  ])
  assert.deepEqual(localEngine.value, next)
  assert.deepEqual(remoteEngine.value, next)

  remotePeer.disconnect()
  assert.deepEqual(hub.peerIds(), ['peer-a'])
})

test('Nano Document in-memory collaboration hub skips duplicate peer revisions', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'old', marks: [] },
      { id: 'b2', type: 'paragraph', text: 'new remote block', marks: [] },
    ],
  }
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'publish insert block',
    origin: 'peer-a',
  })
  const localEngine = createNanoDocument(previous)
  const remoteEngine = createNanoDocument(previous)
  const hub = createNanoDocumentInMemoryCollaborationHub()
  const localPeer = hub.connect({ engine: localEngine, peerId: 'peer-a' })
  const remotePeer = hub.connect({ engine: remoteEngine, peerId: 'peer-b' })
  let remoteCommitCount = 0
  const unsubscribeRemote = remoteEngine.subscribe(() => {
    remoteCommitCount += 1
  })

  assert.equal(commitNanoDocumentChange(localEngine, change).ok, true)
  const dispatch = localPeer.publish(change, { revision: 'retry-1' })
  const duplicateResult = remotePeer.receive(JSON.parse(JSON.stringify(dispatch.message)))
  unsubscribeRemote()

  assert.equal(duplicateResult.ok, true)
  assert.equal(remoteCommitCount, 1)
  assert.deepEqual(remoteEngine.value, next)
})

test('Nano Document collaboration helpers describe change conflict scope', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'remote insert',
    origin: 'peer-a',
  })

  assert.equal(nanoDocumentChangeScope(change), 'text')
  assert.deepEqual(nanoDocumentChangeTouchedPointers(change), ['/blocks/0/text'])
  assert.equal(nanoDocumentChangeTouchesPointer(change, '/blocks'), true)
  assert.equal(nanoDocumentChangeTouchesPointer(change, '/blocks/0'), true)
  assert.equal(nanoDocumentChangeTouchesPointer(change, '/blocks/1'), false)
  assert.deepEqual(nanoDocumentChangeConflictPointers(change, [change]), ['/blocks/0/text'])
  assert.deepEqual(nanoDocumentChangeConflictPointers(change, [
    nanoDocumentChangeFromDocuments(previous, {
      blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [{ type: 'bold', from: 0, to: 3 }] }],
    }, {
      label: 'mark only',
      origin: 'peer-b',
    }),
  ]), ['/blocks/0/text'])
  assert.deepEqual(nanoDocumentChangeConflictPointers(change, [
    nanoDocumentChangeFromDocuments(previous, {
      blocks: [
        { id: 'b1', type: 'paragraph', text: 'old', marks: [] },
        { id: 'b2', type: 'paragraph', text: 'other', marks: [] },
      ],
    }, {
      label: 'append block',
      origin: 'peer-b',
    }),
  ]), [])

  const engine = createNanoDocument(previous)
  assert.equal(applyRemoteNanoDocumentChange(engine, change, {
    origin: 'remote:explicit-peer',
    restoreRemoteSelection: true,
  }).ok, true)
  assert.deepEqual(engine.value, next)
})

test('Nano Document changes use narrow table cell patches when one cell changes', () => {
  const previous = {
    blocks: [{ id: 'table', type: 'table', rows: [['A', 'B'], ['C', 'D']] }],
  }
  const next = {
    blocks: [{ id: 'table', type: 'table', rows: [['A', 'B'], ['changed', 'D']] }],
  }

  assert.deepEqual(nanoDocumentPatchFromDocuments(previous, next), [
    { op: 'replace', path: '/blocks/0/rows/1/0', value: 'changed' },
  ])

  const engine = createNanoDocument(previous)
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'cell edit',
    origin: 'test-provider',
  })
  assert.equal(commitNanoDocumentChange(engine, change).ok, true)
  assert.deepEqual(engine.value, next)
})

test('Nano Document changes use block replacement for one-block mark changes', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'same', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'same', marks: [{ from: 0, to: 4, type: 'bold' }] }],
  }

  assert.deepEqual(nanoDocumentPatchFromDocuments(previous, next), [
    { op: 'replace', path: '/blocks/0', value: next.blocks[0] },
  ])
})

test('Nano Document changes use array patches for single block inserts and removes', () => {
  const previous = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'one', marks: [] },
      { id: 'b3', type: 'paragraph', text: 'three', marks: [] },
    ],
  }
  const inserted = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'one', marks: [] },
      { id: 'b2', type: 'paragraph', text: 'two', marks: [] },
      { id: 'b3', type: 'paragraph', text: 'three', marks: [] },
    ],
  }
  const removed = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'one', marks: [] },
    ],
  }

  assert.deepEqual(nanoDocumentPatchFromDocuments(previous, inserted), [
    { op: 'add', path: '/blocks/1', value: inserted.blocks[1] },
  ])
  assert.deepEqual(nanoDocumentPatchFromDocuments(previous, removed), [
    { op: 'remove', path: '/blocks/1' },
  ])

  const insertEngine = createNanoDocument(previous)
  assert.equal(commitNanoDocumentChange(insertEngine, nanoDocumentChangeFromDocuments(previous, inserted, {
    label: 'insert block',
    origin: 'test-provider',
  })).ok, true)
  assert.deepEqual(insertEngine.value, inserted)

  const removeEngine = createNanoDocument(previous)
  assert.equal(commitNanoDocumentChange(removeEngine, nanoDocumentChangeFromDocuments(previous, removed, {
    label: 'remove block',
    origin: 'test-provider',
  })).ok, true)
  assert.deepEqual(removeEngine.value, removed)
})

test('Nano Document changes fall back to full block array for multiple block changes', () => {
  const previous = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'one', marks: [] },
      { id: 'b2', type: 'paragraph', text: 'two', marks: [] },
    ],
  }
  const next = {
    blocks: [
      { id: 'b1', type: 'paragraph', text: 'changed one', marks: [] },
      { id: 'b2', type: 'paragraph', text: 'changed two', marks: [] },
    ],
  }

  assert.deepEqual(nanoDocumentPatchFromDocuments(previous, next), [
    { op: 'replace', path: '/blocks', value: next.blocks },
  ])
})

test('ProseMirror provider delegates to the Nano Document change envelope', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }
  const selection = selectionSnap(
    point(blockTextPointer(0), 3),
    point(blockTextPointer(0), 3),
  )

  assert.deepEqual(nanoDocumentChangeFromProseMirrorDoc(previous, prosemirrorDocFromNano(next), {
    label: 'insertText',
    selection,
  }), {
    kind: 'nano-document.change',
    label: 'insertText',
    mergePath: '/blocks/0/text',
    operations: [{ op: 'replace', path: '/blocks/0/text', value: 'new' }],
    origin: 'prosemirror-view',
    selection,
  })
})

test('ProseMirror provider accepts source-specific change metadata', () => {
  const previous = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'old', marks: [] }],
  }
  const next = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'new', marks: [] }],
  }

  assert.deepEqual(nanoDocumentChangeFromProseMirrorDoc(previous, prosemirrorDocFromNano(next), {
    label: 'edit markdown source',
    origin: 'markdown-source',
  }), {
    kind: 'nano-document.change',
    label: 'edit markdown source',
    mergePath: '/blocks/0/text',
    operations: [{ op: 'replace', path: '/blocks/0/text', value: 'new' }],
    origin: 'markdown-source',
    selection: null,
  })
})

test('ProseMirror provider returns no Nano Document change for equivalent docs', () => {
  const document = {
    blocks: [{ id: 'b1', type: 'paragraph', text: 'same', marks: [] }],
  }

  assert.equal(nanoDocumentChangeFromProseMirrorDoc(document, prosemirrorDocFromNano(document), {
    label: 'noop',
  }), null)
})

test('ProseMirror table conversion pads ragged rows before schema validation', () => {
  const table = nanoSchema.nodes.table.create({
    id: 'table',
    rows: [['A'], ['1', '2']],
  })
  const prosemirrorDoc = nanoSchema.nodes.doc.create(null, [table])
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(document.blocks, [{
    id: 'table',
    type: 'table',
    rows: [['A', ''], ['1', '2']],
  }])
  assert.deepEqual(NanoDocumentSchema.parse(document), document)
})

test('ProseMirror conversion pads partial line source metadata before schema validation', () => {
  const nodes = nanoSchema.nodes
  const prosemirrorDoc = nodes[nanoNodeNames.doc].create(null, [
    nodes[nanoNodeNames.quote].create(
      { id: 'quote', quoteMarkerSpacing: ['none'], quoteMarkerDepths: [2] },
      nanoSchema.text('one\ntwo'),
    ),
    nodes[nanoNodeNames.callout].create(
      { id: 'callout', tone: 'tip', calloutMarkerSpacing: ['space'], calloutMarkerDepths: [2] },
      nanoSchema.text('head\nbody'),
    ),
    nodes[nanoNodeNames.listItem].create(
      { id: 'list', kind: 'bullet', continuationIndents: ['\t'], indent: 0, marker: '-' },
      nanoSchema.text('one\ntwo\nthree'),
    ),
    nodes[nanoNodeNames.todo].create(
      { id: 'todo', checked: false, continuationIndents: ['\t'], indent: 0, marker: '-' },
      nanoSchema.text('one\ntwo\nthree'),
    ),
    nodes[nanoNodeNames.footnote].create(
      { id: 'footnote', name: '1', footnoteContinuationIndents: ['\t'] },
      nanoSchema.text('one\ntwo\nthree'),
    ),
  ])
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(document.blocks, [
    {
      id: 'quote',
      type: 'quote',
      quoteMarkerSpacing: ['none', 'space'],
      quoteMarkerDepths: [2, 1],
      text: 'one\ntwo',
      marks: [],
    },
    {
      id: 'callout',
      type: 'callout',
      tone: 'tip',
      calloutMarkerDepths: [2, 1],
      calloutMarkerSpacing: ['space', 'space'],
      text: 'head\nbody',
      marks: [],
    },
    {
      id: 'list',
      type: 'list_item',
      kind: 'bullet',
      continuationIndents: ['\t', '  '],
      indent: 0,
      text: 'one\ntwo\nthree',
      marks: [],
    },
    {
      id: 'todo',
      type: 'todo',
      checked: false,
      continuationIndents: ['\t', '      '],
      indent: 0,
      text: 'one\ntwo\nthree',
      marks: [],
    },
    {
      id: 'footnote',
      type: 'footnote',
      footnoteContinuationIndents: ['\t', '    '],
      name: '1',
      text: 'one\ntwo\nthree',
      marks: [],
    },
  ])
  assert.deepEqual(NanoDocumentSchema.parse(document), document)
})

test('ProseMirror conversion drops blank reference marks before schema validation', () => {
  const marks = nanoSchema.marks

  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.tag].create({ name: '   ' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.noteLink].create({ target: '   ', alias: 'Alias' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.math].create({ formula: '   ' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.footnoteRef].create({ name: '   ' }), 0, 1), null)
  assert.equal(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.link].create({ href: '   ' }), 0, 1), null)
  assert.deepEqual(nanoMarkFromProseMirrorMark(marks[nanoMarkNames.link].create({ href: '  https://example.com  ' }), 0, 4), {
    type: 'link',
    from: 0,
    to: 4,
    href: 'https://example.com',
  })
})

test('ProseMirror conversion degrades blank reference atoms before schema validation', () => {
  const nodes = nanoSchema.nodes
  const prosemirrorDoc = nodes[nanoNodeNames.doc].create(null, [
    nodes[nanoNodeNames.bookmark].create({ id: 'bookmark', href: '   ', label: 'Bookmark label' }),
    nodes[nanoNodeNames.noteRef].create({ id: 'note', target: '   ', alias: 'Note alias' }),
    nodes[nanoNodeNames.tagRef].create({ id: 'tag', name: '   ' }),
    nodes[nanoNodeNames.attachment].create({ id: 'attachment', src: '   ', label: 'Attachment label' }),
    nodes[nanoNodeNames.image].create({ id: 'image', src: '   ', alt: 'Image alt' }),
  ])
  const document = nanoDocumentFromProseMirror(prosemirrorDoc)

  assert.deepEqual(document.blocks, [
    { id: 'bookmark', type: 'paragraph', text: 'Bookmark label', marks: [] },
    { id: 'note', type: 'paragraph', text: 'Note alias', marks: [] },
    { id: 'tag', type: 'paragraph', text: '', marks: [] },
    { id: 'attachment', type: 'paragraph', text: 'Attachment label', marks: [] },
    { id: 'image', type: 'paragraph', text: 'Image alt', marks: [] },
  ])
  assert.deepEqual(NanoDocumentSchema.parse(document), document)

  const trimmed = nanoDocumentFromProseMirror(nodes[nanoNodeNames.doc].create(null, [
    nodes[nanoNodeNames.bookmark].create({ id: 'trimmed-bookmark', href: '  https://example.com  ' }),
    nodes[nanoNodeNames.noteRef].create({ id: 'trimmed-note', target: '  Note Title  ' }),
    nodes[nanoNodeNames.attachment].create({ id: 'trimmed-attachment', src: '  file.pdf  ' }),
    nodes[nanoNodeNames.image].create({ id: 'trimmed-image', src: '  image.png  ' }),
  ]))

  assert.deepEqual(trimmed.blocks, [
    { id: 'trimmed-bookmark', type: 'bookmark', href: 'https://example.com' },
    { id: 'trimmed-note', type: 'note_ref', target: 'Note Title' },
    { id: 'trimmed-attachment', type: 'attachment', src: 'file.pdf' },
    { id: 'trimmed-image', type: 'image', src: 'image.png' },
  ])
  assert.deepEqual(NanoDocumentSchema.parse(trimmed), trimmed)
})

test('ProseMirror DOM parsing rejects blank reference marks before attr creation', () => {
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.tag], element({ dataset: { tag: '   ' } })), false)
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.noteLink], element({ dataset: { target: '   ' } })), false)
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.math], element({ dataset: { formula: '   ' } })), false)
  assert.equal(parseAttrs(referenceMarkSpecs[nanoMarkNames.footnoteRef], element({ dataset: { name: '   ' } })), false)
  assert.equal(parseAttrs(linkMarkSpec, element({ attrs: { href: '   ' } })), false)

  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.tag], element({ dataset: { tag: '  release  ' } })), { name: 'release' })
  assert.deepEqual(parseAttrs(linkMarkSpec, element({ attrs: { href: '  https://example.com  ' } })), {
    href: 'https://example.com',
    destinationStyle: '',
    title: '',
    syntax: '',
    image: false,
    imageEmptyAlt: false,
  })
})

test('ProseMirror DOM parsing falls back when reference datasets are blank', () => {
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.tag], element({
    dataset: { tag: '   ' },
    textContent: '#fallback',
  })), { name: 'fallback' })
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.noteLink], element({
    dataset: { target: '   ' },
    textContent: '[[Fallback Note|Alias]]',
  })), { target: 'Fallback Note', alias: 'Alias' })
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.math], element({
    dataset: { formula: '   ' },
    textContent: 'x + y',
  })), { formula: 'x + y' })
  assert.deepEqual(parseAttrs(referenceMarkSpecs[nanoMarkNames.footnoteRef], element({
    dataset: { name: '   ' },
    textContent: '[^source]',
  })), { name: 'source' })
  assert.deepEqual(parseAttrs(linkMarkSpec, element({
    attrs: { href: '   ' },
    dataset: { href: 'https://fallback.example' },
  })), {
    href: 'https://fallback.example',
    destinationStyle: '',
    title: '',
    syntax: '',
    image: false,
    imageEmptyAlt: false,
  })
})

test('ProseMirror DOM parsing rejects blank reference atoms before attr creation', () => {
  assert.equal(parseAttrs(bookmarkNodeSpec, element({ dataset: { href: '   ' } })), false)
  assert.equal(parseAttrs(noteRefNodeSpec, element({ dataset: { target: '   ' } })), false)
  assert.equal(parseAttrs(tagRefNodeSpec, element({ dataset: { tag: '   ' } })), false)
  assert.equal(parseAttrs(attachmentNodeSpec, element({ dataset: { src: '   ' } })), false)
  assert.equal(parseAttrs(imageNodeSpec, element({ query: { img: element({ attrs: { src: '   ' } }) } })), false)
  assert.equal(parseAttrs(imageNodeSpec, element({ attrs: { src: '   ' } }), 1), false)

  assert.deepEqual(parseAttrs(bookmarkNodeSpec, element({ dataset: { href: '  https://example.com  ', label: 'Example' } })), {
    href: 'https://example.com',
    label: 'Example',
    title: '',
    destinationStyle: '',
    syntax: 'bare',
  })
  assert.deepEqual(parseAttrs(imageNodeSpec, element({ attrs: { src: '  /image.png  ', alt: 'Image' } }), 1), {
    src: '/image.png',
    alt: 'Image',
    title: '',
  })
})

test('ProseMirror DOM parsing falls back when reference atom datasets are blank', () => {
  assert.deepEqual(parseAttrs(bookmarkNodeSpec, element({
    dataset: { href: '   ' },
    query: { a: element({ attrs: { href: 'https://fallback.example' } }) },
  })), {
    href: 'https://fallback.example',
    label: '',
    title: '',
    destinationStyle: '',
    syntax: 'bare',
  })
  assert.deepEqual(parseAttrs(noteRefNodeSpec, element({
    dataset: { target: '   ' },
    textContent: '[[Fallback Note|Alias]]',
  })), { target: 'Fallback Note', alias: 'Alias' })
  assert.deepEqual(parseAttrs(tagRefNodeSpec, element({
    dataset: { tag: '   ' },
    textContent: '#fallback',
  })), { name: 'fallback' })
  assert.deepEqual(parseAttrs(attachmentNodeSpec, element({
    dataset: { src: '   ' },
    query: { a: element({ attrs: { href: 'fallback.pdf' } }) },
  })), {
    src: 'fallback.pdf',
    label: '',
    title: '',
    destinationStyle: '',
  })
})

function parseAttrs(spec, dom, ruleIndex = 0) {
  return spec.parseDOM[ruleIndex].getAttrs(dom)
}

function element({ dataset = {}, attrs = {}, textContent = '', query = {} } = {}) {
  return {
    dataset,
    textContent,
    getAttribute: (name) => attrs[name] ?? null,
    querySelector: (selector) => query[selector] ?? null,
  }
}
