// Group color rules (docs/specs/group-colors.md). Plain TypeScript: the mobile app imports this unchanged.
import type { ColorOverrides } from "./color-overrides";
import { GROUP_COLORS, groupPalette, isColorId, SHADE_COUNT, type GroupPalette } from "./palette";

export type ViewerGroup = { id: string; colorId: string; joinedAt: number };
export type ResolvedColor = { colorId: string; shade: number };

/**
 * A color for a new group: the one its members use least, so a free color always wins (COLOR-3). Ties go to palette order.
 * TODO(re-evaluate when group creation exists): call this with `MemberColorSource` when a group is created.
 */
export function suggestGroupColor(colorsUsedByMembers: readonly string[]): string {
  const uses = (id: string) => colorsUsedByMembers.filter((c) => c === id).length;
  return GROUP_COLORS.reduce((best, c) => (uses(c.id) < uses(best.id) ? c : best)).id;
}

/**
 * Each group's color and shade on this viewer's screen (COLOR-5/6/7). Overridden groups go first, then earliest joined,
 * and each group in a color takes the next shade. The color itself only ever changes through the viewer's own override.
 */
export function resolveColorsForViewer(myGroups: readonly ViewerGroup[], overrides: ColorOverrides = {}): Record<string, ResolvedColor> {
  const overrideOf = (g: ViewerGroup) => (isColorId(overrides[g.id] ?? "") ? overrides[g.id] : undefined);
  const ordered = myGroups
    .map((g) => ({ ...g, pinned: overrideOf(g) !== undefined, colorId: overrideOf(g) ?? g.colorId }))
    .filter((g) => isColorId(g.colorId))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : 1));

  const taken = new Map<string, number>();
  const resolved: Record<string, ResolvedColor> = {};
  for (const { id, colorId } of ordered) {
    const count = taken.get(colorId) ?? 0;
    taken.set(colorId, count + 1);
    resolved[id] = { colorId, shade: count % SHADE_COUNT };
  }
  return resolved;
}

/** Puts each group's resolved shade on `palette`, which is what views draw (COLOR-9). `colorId` stays the shared color. */
export function withViewerColors<T extends ViewerGroup & { palette: GroupPalette }>(groups: readonly T[], overrides: ColorOverrides): T[] {
  const resolved = resolveColorsForViewer(groups, overrides);
  return groups.map((g) => {
    const color = resolved[g.id];
    return color ? { ...g, palette: groupPalette(color.colorId, color.shade) } : g;
  });
}
