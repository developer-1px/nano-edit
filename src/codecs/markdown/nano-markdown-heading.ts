// @ts-nocheck
import { atxClosingLength, atxSpacing, setextLength, setextMarker, } from './nano-markdown-heading-attrs.js';
import { inlineMarkdown } from './nano-markdown-inline-serialize.js';
import { textBlock } from './nano-markdown-text-block.js';
export function parseSetextHeading(lines, index, state, isMarkdownBlockLine, isFencedCodeLine, isQuoteLine) {
    const line = lines[index] ?? '';
    const marker = setextHeadingMarker(lines[index + 1] ?? '');
    if (!marker || line.trim() === '' || isFencedCodeLine(line) || isQuoteLine(line) || isMarkdownBlockLine(line))
        return null;
    return {
        block: textBlock('heading', line, state, {
            level: marker.marker === '=' ? 1 : 2,
            headingStyle: 'setext',
            setextMarker: marker.marker,
            setextLength: marker.length,
        }),
        nextIndex: index + 2,
    };
}
export function parseAtxHeadingLine(line, state) {
    const heading = atxHeading(line);
    return heading ? textBlock('heading', heading.text, state, heading.attrs) : null;
}
export function markdownHeading(block) {
    if (block.headingStyle === 'setext' && block.level <= 2) {
        const text = inlineMarkdown(block.text, block.marks);
        return `${text}\n${setextMarker(block.setextMarker, block.level).repeat(setextLength(block.setextLength))}`;
    }
    const marker = '#'.repeat(block.level);
    const text = inlineMarkdown(block.text, block.marks);
    const textSpacing = text ? ' '.repeat(atxSpacing(block.atxTextSpacing)) : '';
    const closing = block.atxClosingLength
        ? `${' '.repeat(atxSpacing(block.atxClosingSpacing))}${'#'.repeat(atxClosingLength(block.atxClosingLength))}`
        : '';
    return text ? `${marker}${textSpacing}${text}${closing}` : marker;
}
function setextHeadingMarker(line) {
    const match = /^[ \t]*(=+|-+)[ \t]*$/.exec(line);
    if (!match)
        return null;
    const markerText = match[1] ?? '';
    const marker = markerText[0] === '=' ? '=' : '-';
    return { marker, length: markerText.length };
}
function atxHeading(line) {
    const match = /^(#{1,6})([ \t]*)(.*?)[ \t]*$/.exec(line);
    if (!match)
        return null;
    const level = (match[1] ?? '').length;
    const textSpacing = (match[2] ?? '').length;
    const rawText = match[3] ?? '';
    if (rawText && textSpacing === 0)
        return null;
    const openingAttrs = textSpacing > 1 ? { atxTextSpacing: textSpacing } : {};
    const closing = /^(.*?)([ \t]+)(#+)$/.exec(rawText);
    if (!closing)
        return { text: rawText, attrs: { level, ...openingAttrs } };
    const closingSpacing = (closing[2] ?? '').length;
    return {
        text: closing[1] ?? '',
        attrs: {
            level,
            ...openingAttrs,
            atxClosingLength: atxClosingLength((closing[3] ?? '').length),
            atxClosingSpacing: atxSpacing(closingSpacing),
        },
    };
}
