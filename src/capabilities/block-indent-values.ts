export function indentText(indent: unknown): string | null {
    return typeof indent === 'string' && /^[\t ]+$/.test(indent) ? indent : null;
}
export function blockIndent(attrs: { indent?: unknown }): number {
    return clampIndent(typeof attrs.indent === 'number' ? attrs.indent : Number(attrs.indent));
}
export function clampIndent(indent: unknown): number {
    const value = typeof indent === 'number' && Number.isFinite(indent) ? Math.trunc(indent) : 0;
    return Math.max(0, Math.min(6, value));
}
