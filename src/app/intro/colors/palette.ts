// The fixed group palette (docs/specs/group-colors.md, COLOR-1/2). Plain TypeScript: the mobile app imports this unchanged.

/** Same shape as `Palette` in the views, so a shade can be drawn as it is. */
export type GroupPalette = { canopy: string; shade: string; highlight: string; rim: string };

export type GroupColor = { id: string; label: string };

/** Each color's base shade. Red, orange, amber, green, blue and purple are the designer's originals: keep them exact, even below 4.5:1 (COLOR-2). */
const BASES: readonly (GroupColor & { base: GroupPalette })[] = [
  { id: "red", label: "Red", base: { canopy: "#C8432B", shade: "#93281A", highlight: "#F3A088", rim: "#FFD2C4" } },
  { id: "orange", label: "Orange", base: { canopy: "#E8792E", shade: "#A8501A", highlight: "#F7B98A", rim: "#FFE3CC" } },
  { id: "amber", label: "Amber", base: { canopy: "#E3A22F", shade: "#B97814", highlight: "#FBE2A0", rim: "#FFF0BE" } },
  { id: "olive", label: "Olive", base: { canopy: "#5D690F", shade: "#434C0B", highlight: "#B6BC93", rim: "#DFE1CF" } },
  { id: "green", label: "Green", base: { canopy: "#5E8068", shade: "#3F5F4C", highlight: "#B8D2BE", rim: "#D6F0DC" } },
  { id: "teal", label: "Teal", base: { canopy: "#106F6C", shade: "#0C504E", highlight: "#93BEBD", rim: "#CFE2E2" } },
  { id: "blue", label: "Blue", base: { canopy: "#3F86C4", shade: "#285E92", highlight: "#A9CFEF", rim: "#D8ECFB" } },
  { id: "indigo", label: "Indigo", base: { canopy: "#5155CD", shade: "#3A3D94", highlight: "#B1B3E9", rim: "#DCDDF5" } },
  { id: "purple", label: "Purple", base: { canopy: "#9A4FB0", shade: "#6B2F80", highlight: "#D7AEE3", rim: "#F0DDF6" } },
  { id: "magenta", label: "Magenta", base: { canopy: "#B22688", shade: "#801B62", highlight: "#DC9DC9", rim: "#F0D4E7" } },
  { id: "rose", label: "Rose", base: { canopy: "#BE2249", shade: "#891835", highlight: "#E29CAD", rim: "#F2D3DB" } },
  { id: "slate", label: "Slate", base: { canopy: "#55657B", shade: "#3D4959", highlight: "#B3BAC4", rim: "#DDE0E5" } },
];

/** How far each shade darkens its base. A lighter shade would always lose contrast against cream, so clash shades only darken (COLOR-2). */
const DARKENING = [0, 0.18, 0.34];

export const GROUP_COLORS: readonly GroupColor[] = BASES.map(({ id, label }) => ({ id, label }));
export const SHADE_COUNT = DARKENING.length;

export const isColorId = (id: string) => BASES.some((c) => c.id === id);

function mix(hex: string, target: number, amount: number): string {
  const channels = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + target * amount));
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** A color's palette at a shade (0 base, then darker; past the last it wraps). An unknown id gets the first color. */
export function groupPalette(colorId: string, shade: number): GroupPalette {
  const { base } = BASES.find((c) => c.id === colorId) ?? BASES[0];
  const amount = DARKENING[shade % SHADE_COUNT];
  if (amount === 0) return base;
  return { canopy: mix(base.canopy, 0, amount), shade: mix(base.shade, 0, amount), highlight: mix(base.highlight, 0, amount), rim: mix(base.rim, 0, amount) };
}
