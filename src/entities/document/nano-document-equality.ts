export function nanoBlocksEqual(left: unknown, right: unknown): boolean {
    return jsonValuesEqual(left, right);
}
export function nanoBlockEqual(left: unknown, right: unknown): boolean {
    return jsonValuesEqual(left, right);
}
export function nanoBlockAttrsEqual(left: unknown, right: unknown, omittedKeys: readonly string[]): boolean {
    return jsonRecordsEqual(left, right, new Set(omittedKeys));
}
function jsonValuesEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right))
        return true;
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
            return false;
        return left.every((value, index) => jsonValuesEqual(value, right[index]));
    }
    if (!isJsonRecord(left) || !isJsonRecord(right))
        return false;
    return jsonRecordsEqual(left, right);
}
function jsonRecordsEqual(left: unknown, right: unknown, omittedKeys: ReadonlySet<string> = new Set()): boolean {
    if (!isJsonRecord(left) || !isJsonRecord(right))
        return false;
    const leftKeys = jsonRecordKeys(left, omittedKeys);
    const rightKeys = jsonRecordKeys(right, omittedKeys);
    if (leftKeys.length !== rightKeys.length)
        return false;
    return leftKeys.every((key, index) => (key === rightKeys[index]
        && jsonValuesEqual(left[key], right[key])));
}
function jsonRecordKeys(value: Record<string, unknown>, omittedKeys: ReadonlySet<string>): string[] {
    return Object.keys(value)
        .filter((key) => !omittedKeys.has(key) && value[key] !== undefined)
        .sort();
}
function isJsonRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
