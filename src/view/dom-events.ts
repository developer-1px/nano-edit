export function isClipboardEvent(event: Event): event is ClipboardEvent {
    return 'clipboardData' in event;
}
export function isFocusEvent(event: Event): event is FocusEvent {
    return 'relatedTarget' in event;
}
export function isInputEvent(event: Event): event is InputEvent {
    return 'inputType' in event;
}
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
    return 'key' in event;
}
