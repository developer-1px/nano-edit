export function prosemirrorParseDomElement(dom: HTMLElement | string): HTMLElement | null {
    return typeof dom === 'string' ? null : dom;
}
