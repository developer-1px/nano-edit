import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

export function markTypeForName(state: EditorState, markName: string): MarkType | null {
    return state.schema.marks[markName] ?? null;
}
