import type { NanoDocument } from '../core/nano-core'
import type { NanoDocumentIndex } from './nano-document-index-types'
import {
  specialSearchBlockIds,
  tagSearchBlockIds,
  textSearchBlockIds,
} from './nano-document-search-block-ids'
import { intersectBlockIds } from './nano-document-search-sets'
import type { ParsedNanoSearchClause } from './nano-document-search-types'

export function searchClauseBlockIds(
  document: NanoDocument,
  index: NanoDocumentIndex,
  clause: ParsedNanoSearchClause,
): Set<string> {
  let matches = new Set(document.blocks.map((block) => block.id))

  for (const filter of clause.filters) {
    matches = intersectBlockIds(matches, specialSearchBlockIds(filter, document, index))
  }
  for (const tag of clause.tags) {
    matches = intersectBlockIds(matches, tagSearchBlockIds(document, tag, 'tree'))
  }
  for (const tag of clause.exactTags) {
    matches = intersectBlockIds(matches, tagSearchBlockIds(document, tag, 'exact'))
  }
  if (clause.terms.length > 0) {
    matches = intersectBlockIds(matches, textSearchBlockIds(document, clause.terms))
  }

  return matches
}
