export function intersectBlockIds(left: ReadonlySet<string>, right: ReadonlySet<string>): Set<string> {
  return new Set([...left].filter((id) => right.has(id)))
}

export function unionBlockIds(sets: readonly ReadonlySet<string>[]): Set<string> {
  return new Set(sets.flatMap((set) => [...set]))
}

export function subtractBlockIds(left: ReadonlySet<string>, right: ReadonlySet<string>): Set<string> {
  return new Set([...left].filter((id) => !right.has(id)))
}
