// @ts-nocheck
import { NanoDocumentSchema, } from '../../entities/document/nano-document-model.js';
import { normalizeTagName, tagMatchesReference, tagTokensInText, } from '../../entities/reference/nano-tag.js';
import { indexBlockLabel, indexBlockSearchLabel } from '../document-index/block-labels.js';
import { blockMarks } from '../document-index/label-marks.js';
import { nanoDocumentIndex } from '../document-index/build.js';
import { parseNanoSearchQuery } from './query.js';
export function nanoDocumentSearch(document, query) {
    const parsed = parseNanoSearchQuery(query);
    if (!parsed)
        return null;
    const validDocument = NanoDocumentSchema.parse(document);
    const index = nanoDocumentIndex(validDocument);
    let matches = parsed.clauses.length > 1
        ? unionBlockIds(parsed.clauses.map((clause) => searchClauseBlockIds(validDocument, index, clause)))
        : searchClauseBlockIds(validDocument, index, parsed.clauses[0]);
    for (const filter of parsed.excludedFilters) {
        matches = subtractBlockIds(matches, specialSearchBlockIds(filter, validDocument, index));
    }
    for (const tag of parsed.excludedTags) {
        matches = subtractBlockIds(matches, tagSearchBlockIds(validDocument, tag, 'tree'));
    }
    for (const tag of parsed.excludedExactTags) {
        matches = subtractBlockIds(matches, tagSearchBlockIds(validDocument, tag, 'exact'));
    }
    if (parsed.excludedTerms.length > 0) {
        matches = subtractBlockIds(matches, textSearchBlockIds(validDocument, parsed.excludedTerms));
    }
    return {
        query: parsed.query,
        blockIds: validDocument.blocks.map((block) => block.id).filter((id) => matches.has(id)),
        filters: parsed.filters,
        excludedFilters: parsed.excludedFilters,
        tags: parsed.tags,
        exactTags: parsed.exactTags,
        excludedTags: parsed.excludedTags,
        excludedExactTags: parsed.excludedExactTags,
        terms: parsed.terms,
        excludedTerms: parsed.excludedTerms,
    };
}
function searchClauseBlockIds(document, index, clause) {
    let matches = new Set(document.blocks.map((block) => block.id));
    for (const filter of clause.filters) {
        matches = intersectBlockIds(matches, specialSearchBlockIds(filter, document, index));
    }
    for (const tag of clause.tags) {
        matches = intersectBlockIds(matches, tagSearchBlockIds(document, tag, 'tree'));
    }
    for (const tag of clause.exactTags) {
        matches = intersectBlockIds(matches, tagSearchBlockIds(document, tag, 'exact'));
    }
    if (clause.terms.length > 0) {
        matches = intersectBlockIds(matches, textSearchBlockIds(document, clause.terms));
    }
    return matches;
}
function intersectBlockIds(left, right) {
    return new Set([...left].filter((id) => right.has(id)));
}
function unionBlockIds(sets) {
    return new Set(sets.flatMap((set) => [...set]));
}
function subtractBlockIds(left, right) {
    return new Set([...left].filter((id) => !right.has(id)));
}
function specialSearchBlockIds(filter, document, index) {
    switch (filter) {
        case '@attachments':
            return new Set([
                ...index.attachments.map((entry) => entry.blockId),
                ...index.images.map((entry) => entry.blockId),
            ]);
        case '@files':
            return new Set(index.attachments.map((entry) => entry.blockId));
        case '@backlinks':
            return new Set(index.backlinks.flatMap((entry) => blockEntryIds(entry)));
        case '@code':
            return new Set(document.blocks.filter((block) => block.type === 'code').map((block) => block.id));
        case '@done':
            return new Set(index.todos.filter((entry) => entry.checked).map((entry) => entry.blockId));
        case '@images':
            return new Set(index.images.map((entry) => entry.blockId));
        case '@math':
            return new Set(index.math.flatMap((entry) => blockEntryIds(entry)));
        case '@tables':
            return new Set(index.tables.map((entry) => entry.blockId));
        case '@tagged':
            return new Set(document.blocks.filter((block) => blockTagNames(block).length > 0).map((block) => block.id));
        case '@task':
            return new Set(index.todos.map((entry) => entry.blockId));
        case '@title':
            return new Set(document.blocks.filter((block) => block.type === 'heading').map((block) => block.id));
        case '@todo':
            return new Set(index.todos.filter((entry) => !entry.checked).map((entry) => entry.blockId));
        case '@untagged':
            return new Set(document.blocks.filter((block) => blockTagNames(block).length === 0).map((block) => block.id));
        case '@wikilinks':
            return new Set(index.noteLinks.flatMap((entry) => blockEntryIds(entry)));
    }
}
function tagSearchBlockIds(document, tag, mode) {
    const target = normalizeTagName(tag).toLowerCase();
    return new Set(document.blocks
        .filter((block) => blockTagNames(block).some((name) => {
        const normalized = normalizeTagName(name).toLowerCase();
        return mode === 'exact'
            ? normalized === target
            : tagMatchesReference(normalized, target);
    }))
        .map((block) => block.id));
}
function textSearchBlockIds(document, terms) {
    return new Set(document.blocks
        .filter((block) => {
        const text = searchableBlockText(block).toLowerCase();
        return terms.every((term) => text.includes(term));
    })
        .map((block) => block.id));
}
function blockEntryIds(entry) {
    return entry.blockIds ?? [entry.blockId];
}
function searchableBlockText(block) {
    const values = [indexBlockLabel(block), indexBlockSearchLabel(block)];
    if ('text' in block && typeof block.text === 'string')
        values.push(block.text);
    if (block.type === 'bookmark')
        values.push(block.href, block.label ?? '', block.title ?? '');
    if (block.type === 'note_ref')
        values.push(block.target, block.alias ?? '');
    if (block.type === 'tag_ref')
        values.push(block.name);
    if (block.type === 'attachment')
        values.push(block.src, block.label ?? '', block.title ?? '');
    if (block.type === 'image')
        values.push(block.src, block.alt ?? '', block.title ?? '');
    if (block.type === 'table')
        values.push(...block.rows.flat());
    for (const mark of blockMarks(block)) {
        if (mark.type === 'tag')
            values.push(mark.name);
        if (mark.type === 'note_link')
            values.push(mark.target, mark.alias ?? '');
        if (mark.type === 'math')
            values.push(mark.formula);
        if (mark.type === 'footnote_ref')
            values.push(mark.name);
        if (mark.type === 'link')
            values.push(mark.href, mark.title ?? '');
    }
    return values.filter(Boolean).join(' ');
}
function blockTagNames(block) {
    const names = [];
    if (block.type === 'tag_ref')
        names.push(block.name);
    if (block.type === 'table') {
        for (const row of block.rows) {
            for (const cell of row) {
                names.push(...tagTokensInText(cell).map((tag) => tag.name));
            }
        }
    }
    for (const mark of blockMarks(block)) {
        if (mark.type === 'tag')
            names.push(mark.name);
    }
    return names;
}
