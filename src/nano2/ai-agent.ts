import { z } from 'zod'
import {
  commitNanoDocumentChange,
  nanoDocumentChangeFromDocuments,
  parseNanoDocumentChange,
  type NanoDocumentChange,
} from '../entities/document/nano-document-change'
import type { NanoDocumentEngine } from '../entities/document/nano-document'
import { NanoDocumentSchema, type NanoDocument } from '../entities/document/nano-document-model'

export interface Nano2AgentDocumentRead {
  blockCount: number
  text: string
  textBlockCount: number
}

export interface Nano2AgentRewriteOptions {
  blockId: string
  prompt: string
  text: string
}

export interface Nano2AgentProposal {
  change: NanoDocumentChange
  id: string
  kind: 'nano2.agent.proposal'
  prompt: string
  summary: string
}

const Nano2AgentProposalSchema = z.object({
  change: z.unknown(),
  id: z.string().min(1),
  kind: z.literal('nano2.agent.proposal'),
  prompt: z.string().min(1),
  summary: z.string().min(1),
}).strict()

export function nano2AgentReadDocument(documentValue: NanoDocument): Nano2AgentDocumentRead {
  const document = NanoDocumentSchema.parse(documentValue)
  const texts = document.blocks
    .map((block) => nanoBlockText(block))
    .filter((text): text is string => text !== null)
  return {
    blockCount: document.blocks.length,
    text: texts.join('\n'),
    textBlockCount: texts.length,
  }
}

export function nano2AgentRewriteBlockProposal(
  documentValue: NanoDocument,
  options: Nano2AgentRewriteOptions,
): Nano2AgentProposal | null {
  const previous = NanoDocumentSchema.parse(documentValue)
  const blockIndex = previous.blocks.findIndex((block) => block.id === options.blockId)
  if (blockIndex < 0) return null

  const block = previous.blocks[blockIndex]
  if (!block || nanoBlockText(block) === null) return null

  const next = NanoDocumentSchema.parse({
    ...previous,
    blocks: previous.blocks.map((candidate, index) => index === blockIndex
      ? { ...candidate, text: options.text }
      : candidate),
  })
  const change = nanoDocumentChangeFromDocuments(previous, next, {
    label: 'nano2-agent-rewrite-block',
    origin: 'nano2-ai-agent',
  })
  if (!change) return null

  return {
    change,
    id: `nano2-agent:${options.blockId}`,
    kind: 'nano2.agent.proposal',
    prompt: options.prompt,
    summary: `Rewrite ${options.blockId}`,
  }
}

export function parseNano2AgentProposal(payload: unknown): Nano2AgentProposal | null {
  const parsed = Nano2AgentProposalSchema.safeParse(payload)
  if (!parsed.success) return null
  const change = parseNanoDocumentChange(parsed.data.change)
  if (!change) return null
  return {
    change,
    id: parsed.data.id,
    kind: parsed.data.kind,
    prompt: parsed.data.prompt,
    summary: parsed.data.summary,
  }
}

export function nano2AgentAcceptProposal(
  engine: NanoDocumentEngine,
  proposal: Nano2AgentProposal,
): ReturnType<NanoDocumentEngine['commit']> {
  return commitNanoDocumentChange(engine, proposal.change)
}

function nanoBlockText(block: NanoDocument['blocks'][number]): string | null {
  const text = (block as { text?: unknown }).text
  return typeof text === 'string' ? text : null
}
