import type { EditorView } from 'prosemirror-view';

interface ProseMirrorDomObserver {
    start: () => void;
    stop: () => void;
}

type ProseMirrorDomObserverHost = EditorView | { dom: HTMLElement };

export function withoutProseMirrorDomObserver<T>(view: ProseMirrorDomObserverHost, run: () => T): T {
    const observer = prosemirrorDomObserver(view);
    observer?.stop();
    try {
        return run();
    }
    finally {
        observer?.start();
    }
}
function prosemirrorDomObserver(view: ProseMirrorDomObserverHost): ProseMirrorDomObserver | null {
    const observer = Reflect.get(view, 'domObserver');
    return isProseMirrorDomObserver(observer) ? observer : null;
}
function isProseMirrorDomObserver(value: unknown): value is ProseMirrorDomObserver {
    if (typeof value !== 'object' || value === null)
        return false;
    const start = Reflect.get(value, 'start');
    const stop = Reflect.get(value, 'stop');
    return typeof start === 'function' && typeof stop === 'function';
}
