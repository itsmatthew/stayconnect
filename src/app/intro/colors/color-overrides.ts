// A viewer's personal group colors (docs/specs/group-colors.md, COLOR-7/8). Plain TypeScript; storage is swapped per platform.

/** Group id → the color this viewer picked. */
export type ColorOverrides = Readonly<Record<string, string>>;

/** Async, because mobile storage is. */
export interface ColorOverrideStore {
  load(): Promise<ColorOverrides>;
  save(overrides: ColorOverrides): Promise<void>;
}

export const setOverride = (overrides: ColorOverrides, groupId: string, colorId: string): ColorOverrides => ({ ...overrides, [groupId]: colorId });

export function clearOverride(overrides: ColorOverrides, groupId: string): ColorOverrides {
  return Object.fromEntries(Object.entries(overrides).filter(([id]) => id !== groupId));
}

/** Keeps what's valid from stored data of any shape. */
export function parseOverrides(raw: unknown): ColorOverrides {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, colorId]) => typeof colorId === "string"));
}
