// Who a gift can go to (docs/specs/gifts.md, GIFT-4). Plain TypeScript.

export type RecipientSections<F, G> = { groups: G[]; nest: F[]; branches: F[]; everyone: F[] };

type Choices<F, G> = { friends: readonly F[]; groups: readonly G[]; placements: Readonly<Record<string, string>> };

/**
 * Groups, then people by ring, with bloom and people not placed yet in `everyone`. `query` filters all of them by name,
 * ignoring case. A group with nobody in it has no one to receive the gift, so it isn't offered.
 */
export function giftRecipients<F extends { id: string; name: string }, G extends { name: string; members: readonly string[] }>({ friends, groups, placements }: Choices<F, G>, query: string): RecipientSections<F, G> {
  const q = query.trim().toLowerCase();
  const matches = (x: { name: string }) => x.name.toLowerCase().includes(q);
  const found = friends.filter(matches);
  const ring = (r: string) => found.filter((f) => placements[f.id] === r);
  return { groups: groups.filter((g) => g.members.length > 0 && matches(g)), nest: ring("nest"), branches: ring("branches"), everyone: found.filter((f) => placements[f.id] !== "nest" && placements[f.id] !== "branches") };
}
