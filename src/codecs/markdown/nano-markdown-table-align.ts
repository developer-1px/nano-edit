export type TableAlign = 'left' | 'center' | 'right' | null;

export function tableAlignment(align: unknown): TableAlign {
    return align === 'left' || align === 'center' || align === 'right' ? align : null;
}
export function tableSeparatorCellAlignment(cell: string): TableAlign | false {
    const value = cell.trim();
    if (!/^:?-{3,}:?$/.test(value))
        return false;
    const left = value.startsWith(':');
    const right = value.endsWith(':');
    if (left && right)
        return 'center';
    if (left)
        return 'left';
    if (right)
        return 'right';
    return null;
}
export function markdownTableSeparatorCell(align: TableAlign | undefined): string {
    switch (align) {
        case 'left':
            return ':---';
        case 'center':
            return ':---:';
        case 'right':
            return '---:';
        default:
            return '---';
    }
}
