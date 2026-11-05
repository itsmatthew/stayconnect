// The fixed group palette (docs/specs/group-colors.md, COLOR-1/2). Plain TypeScript: the mobile app imports this unchanged.

/** Same shape as `Palette` in the views, so a shade can be drawn as it is. */
export type GroupPalette = { canopy: string; shade: string; highlight: string; rim: string };

export type GroupColor = { id: string; label: string };

/** Each color's canopies: base, darker, lighter. Aim for about 5.5, 7.5 and 4.6 to 1 against cream; a test holds them to 4.5 (COLOR-2). */
const CANOPIES: readonly (GroupColor & { canopies: readonly [string, string, string] })[] = [
  { id: "red", label: "Red", canopies: ["#B73420", "#932A1A", "#CC3A24"] },
  { id: "orange", label: "Orange", canopies: ["#A3490D", "#823A0B", "#B7520F"] },
  { id: "amber", label: "Amber", canopies: ["#825D07", "#684A05", "#926808"] },
  { id: "olive", label: "Olive", canopies: ["#5D690F", "#4B540C", "#697611"] },
  { id: "green", label: "Green", canopies: ["#2B713C", "#225A30", "#307E44"] },
  { id: "teal", label: "Teal", canopies: ["#106F6C", "#0D5957", "#127C79"] },
  { id: "blue", label: "Blue", canopies: ["#1D67A4", "#175283", "#2073B7"] },
  { id: "indigo", label: "Indigo", canopies: ["#5155CD", "#383CC0", "#6063D1"] },
  { id: "purple", label: "Purple", canopies: ["#943BB2", "#772F8E", "#A346C1"] },
  { id: "magenta", label: "Magenta", canopies: ["#B22688", "#8F1E6E", "#C72A98"] },
  { id: "rose", label: "Rose", canopies: ["#BE2249", "#991B3B", "#D52651"] },
  { id: "slate", label: "Slate", canopies: ["#55657B", "#445062", "#60718A"] },
];

export const GROUP_COLORS: readonly GroupColor[] = CANOPIES.map(({ id, label }) => ({ id, label }));
export const SHADE_COUNT = 3;

export const isColorId = (id: string) => CANOPIES.some((c) => c.id === id);

function mix(hex: string, target: number, amount: number): string {
  const channels = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + target * amount));
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** A color's palette at a shade (0 base, 1 darker, 2 lighter; past that it wraps). An unknown id gets the first color. */
export function groupPalette(colorId: string, shade: number): GroupPalette {
  const { canopies } = CANOPIES.find((c) => c.id === colorId) ?? CANOPIES[0];
  const canopy = canopies[shade % SHADE_COUNT];
  return { canopy, shade: mix(canopy, 0, 0.28), highlight: mix(canopy, 255, 0.55), rim: mix(canopy, 255, 0.8) };
}
