// Pure carousel maths for the home circles (docs/specs/home.md, HOME-2).

/** Moves `index` by `delta`, wrapping within `length`. */
export function rotate(index: number, delta: number, length: number): number {
  return (((index + delta) % length) + length) % length;
}

/** The `radius` items either side of `center`, wrapping, center in the middle. */
export function visibleAround<T>(items: readonly T[], center: number, radius: number): T[] {
  const out: T[] = [];
  for (let d = -radius; d <= radius; d++) out.push(items[rotate(center, d, items.length)]);
  return out;
}
