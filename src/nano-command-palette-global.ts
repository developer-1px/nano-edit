export function createGlobalCommandPaletteShortcut(openGlobalPalette: () => void): (event: KeyboardEvent) => void {
  return (event) => {
    if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) return
    event.preventDefault()
    event.stopPropagation()
    openGlobalPalette()
  }
}
