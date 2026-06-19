import { z } from 'zod'
import {
  commitNanoDocumentChange,
  createNanoDocumentChange,
  parseNanoDocumentChange,
  type NanoDocumentChange,
} from '../entities/document/nano-document-change'
import { createNanoDocument, type NanoDocumentEngine } from '../entities/document/nano-document'
import { NanoDocumentSchema, type NanoDocument } from '../entities/document/nano-document-model'

export const nano2CollaborativeFieldIds = ['summary', 'tasks', 'notes'] as const

export type Nano2CollaborativeFieldId = typeof nano2CollaborativeFieldIds[number]
export type Nano2CollaborativeFieldEngines = Record<Nano2CollaborativeFieldId, NanoDocumentEngine>

export const Nano2CollaborativeFieldsDocumentSchema = z.object({
  notes: NanoDocumentSchema,
  summary: NanoDocumentSchema,
  tasks: NanoDocumentSchema,
}).strict()

export type Nano2CollaborativeFieldsDocument = z.infer<typeof Nano2CollaborativeFieldsDocumentSchema>

export interface Nano2CollaborativeFieldsMessage {
  change: NanoDocumentChange
  fieldId: Nano2CollaborativeFieldId
  kind: 'nano2.collaborative-fields.change'
  peerId: string
  revision?: number | string
}

export interface Nano2CollaborativeFieldsDispatch {
  message: Nano2CollaborativeFieldsMessage
  results: readonly Nano2CollaborativeFieldsPeerResult[]
}

export interface Nano2CollaborativeFieldsPeerResult {
  peerId: string
  result: ReturnType<NanoDocumentEngine['commit']>
}

export interface Nano2CollaborativeFieldsPeer {
  peerId: string
  disconnect(): void
  publish(
    fieldId: Nano2CollaborativeFieldId,
    change: NanoDocumentChange,
    options?: { revision?: number | string },
  ): Nano2CollaborativeFieldsDispatch
  receive(payload: unknown): ReturnType<NanoDocumentEngine['commit']>
}

export interface Nano2CollaborativeFieldsHub {
  connect(options: {
    fields: Nano2CollaborativeFieldEngines
    peerId: string
  }): Nano2CollaborativeFieldsPeer
  fieldIds(): Nano2CollaborativeFieldId[]
  peerIds(): string[]
}

const Nano2CollaborativeFieldsMessageSchema = z.object({
  change: z.unknown(),
  fieldId: z.enum(nano2CollaborativeFieldIds),
  kind: z.literal('nano2.collaborative-fields.change'),
  peerId: z.string().min(1),
  revision: z.union([z.number().int().nonnegative(), z.string().min(1)]).optional(),
}).strict()

export function createNano2CollaborativeFieldEngines(
  documentValue: Nano2CollaborativeFieldsDocument,
): Nano2CollaborativeFieldEngines {
  const document = Nano2CollaborativeFieldsDocumentSchema.parse(documentValue)
  return {
    notes: createNanoDocument(cloneNanoDocument(document.notes)),
    summary: createNanoDocument(cloneNanoDocument(document.summary)),
    tasks: createNanoDocument(cloneNanoDocument(document.tasks)),
  }
}

export function createNano2CollaborativeFieldsHub(): Nano2CollaborativeFieldsHub {
  const peers = new Map<string, {
    fields: Nano2CollaborativeFieldEngines
    peer: Nano2CollaborativeFieldsPeer
    receivedKeys: Set<string>
  }>()

  return {
    connect(options) {
      const peerId = options.peerId.trim()
      if (!peerId) throw new Error('Nano2 collaborative fields peer id must not be blank')
      if (peers.has(peerId)) throw new Error(`Nano2 collaborative fields peer already connected: ${peerId}`)
      assertCollaborativeFieldEngines(options.fields)

      const receivedKeys = new Set<string>()
      const peer: Nano2CollaborativeFieldsPeer = {
        peerId,
        disconnect() {
          if (peers.get(peerId)?.peer === peer) peers.delete(peerId)
        },
        publish(fieldId, change, publishOptions = {}) {
          const message = createNano2CollaborativeFieldsMessage(fieldId, change, {
            peerId,
            revision: publishOptions.revision,
          })
          const results = [...peers.values()].map((candidate) => ({
            peerId: candidate.peer.peerId,
            result: candidate.peer.receive(message),
          }))
          return { message, results }
        },
        receive(payload) {
          const message = parseNano2CollaborativeFieldsMessage(payload)
          if (!message) {
            return {
              ok: false,
              code: 'schema_violation',
              reason: 'invalid Nano2 collaborative fields payload',
            }
          }
          if (message.peerId === peerId) return { ok: true }

          const deliveryKey = collaborativeFieldsDeliveryKey(message)
          if (deliveryKey && receivedKeys.has(deliveryKey)) return { ok: true }

          const engine = options.fields[message.fieldId]
          const result = commitNanoDocumentChange(engine, remoteFieldChange(message))
          if (result.ok && deliveryKey) receivedKeys.add(deliveryKey)
          return result
        },
      }

      peers.set(peerId, { fields: options.fields, peer, receivedKeys })
      return peer
    },
    fieldIds() {
      return [...nano2CollaborativeFieldIds]
    },
    peerIds() {
      return [...peers.keys()]
    },
  }
}

export function createNano2CollaborativeFieldsMessage(
  fieldId: Nano2CollaborativeFieldId,
  change: NanoDocumentChange,
  options: { peerId: string; revision?: number | string },
): Nano2CollaborativeFieldsMessage {
  const parsed = Nano2CollaborativeFieldsMessageSchema.safeParse({
    change,
    fieldId,
    kind: 'nano2.collaborative-fields.change',
    peerId: options.peerId,
    revision: options.revision,
  })
  if (!parsed.success) throw new Error('Invalid Nano2 collaborative fields message')
  const parsedChange = parseNanoDocumentChange(parsed.data.change)
  if (!parsedChange) throw new Error('Invalid NanoDocumentChange for collaborative field')
  return {
    change: parsedChange,
    fieldId: parsed.data.fieldId,
    kind: parsed.data.kind,
    peerId: parsed.data.peerId,
    ...(parsed.data.revision === undefined ? {} : { revision: parsed.data.revision }),
  }
}

export function parseNano2CollaborativeFieldsMessage(payload: unknown): Nano2CollaborativeFieldsMessage | null {
  const parsed = Nano2CollaborativeFieldsMessageSchema.safeParse(payload)
  if (!parsed.success) return null
  const change = parseNanoDocumentChange(parsed.data.change)
  if (!change) return null
  return {
    change,
    fieldId: parsed.data.fieldId,
    kind: parsed.data.kind,
    peerId: parsed.data.peerId,
    ...(parsed.data.revision === undefined ? {} : { revision: parsed.data.revision }),
  }
}

function assertCollaborativeFieldEngines(fields: Nano2CollaborativeFieldEngines): void {
  for (const fieldId of nano2CollaborativeFieldIds) {
    NanoDocumentSchema.parse(fields[fieldId].value)
  }
}

function remoteFieldChange(message: Nano2CollaborativeFieldsMessage): NanoDocumentChange {
  return createNanoDocumentChange({
    label: message.change.label,
    mergePath: message.change.mergePath ?? null,
    operations: message.change.operations,
    origin: `remote:${message.peerId}:${message.fieldId}`,
    selection: null,
  })
}

function collaborativeFieldsDeliveryKey(message: Nano2CollaborativeFieldsMessage): string | null {
  if (message.revision === undefined) return null
  return `${message.fieldId}\u0000${message.peerId}\u0000${typeof message.revision}:${message.revision}`
}

function cloneNanoDocument(document: NanoDocument): NanoDocument {
  return JSON.parse(JSON.stringify(document)) as NanoDocument
}
