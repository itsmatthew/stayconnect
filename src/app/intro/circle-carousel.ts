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

/**
 * Where home opens: the middle closest circle (left of middle for an even count), as an index into `groups`.
 * Closest circles come first, so the center and its nearest neighbours are closest circles.
 */
export function openingCenter(groups: readonly { closest: boolean }[]): number {
  const closest = groups.flatMap((g, i) => (g.closest ? [i] : []));
  return closest.length ? closest[Math.floor((closest.length - 1) / 2)] : 0;
}


/**
 * The `radius` slots either side of `center`, each item at most once (HOME-2, HOME-24): nearest the center first, right
 * before left, and `null` for a slot with no item left, drawn as an outline tree.
 */
export function slotsAround<T>(items: readonly T[], center: number, radius: number): (T | null)[] {
  const out: (T | null)[] = Array(2 * radius + 1).fill(null);
  const used = new Set<number>();
  const place = (d: number) => {
    const i = rotate(center, d, items.length);
    if (used.has(i)) return;
    used.add(i);
    out[radius + d] = items[i];
  };
  place(0);
  for (let d = 1; d <= radius; d++) {
    place(d);
    place(-d);
  }
  return out;
}
