// Who a gift can go to (docs/specs/gifts.md, GIFT-4). Plain TypeScript.

export type RecipientSections<T> = { nest: T[]; branches: T[]; everyone: T[] };

/** By ring, with bloom and people not placed yet in `everyone`. `query` filters all of them by name, ignoring case. */
export function giftRecipients<T extends { id: string; name: string }>(friends: readonly T[], placements: Readonly<Record<string, string>>, query: string): RecipientSections<T> {
  const q = query.trim().toLowerCase();
  const found = friends.filter((f) => f.name.toLowerCase().includes(q));
  const ring = (r: string) => found.filter((f) => placements[f.id] === r);
  return { nest: ring("nest"), branches: ring("branches"), everyone: found.filter((f) => placements[f.id] !== "nest" && placements[f.id] !== "branches") };
}
