// What a gift can be made from (docs/specs/gifts.md, GIFT-10). Every item says whether it's free or paid, so one can
// become paid later without changing saved gifts. All are free for now. Plain TypeScript.

export type Access = { kind: "free" } | { kind: "paid"; sku: string };
export type CatalogItem = { id: string; label: string; access: Access };

const FREE: Access = { kind: "free" };
const free = <T extends { id: string; label: string }>(items: readonly T[]): (T & { access: Access })[] => items.map((i) => ({ ...i, access: FREE }));

export const FRAMES = free([
  { id: "classic", label: "Classic", blurb: "a clean white border" },
  { id: "instant", label: "Instant", blurb: "room to write the date" },
  { id: "album", label: "Album", blurb: "corners, like the old albums" },
  { id: "film", label: "Film", blurb: "one frame off the roll" },
  { id: "wood", label: "Wood", blurb: "a little heavier, for the wall" },
  { id: "november", label: "November", blurb: "warm, for the cold months" },
]);

export const HANDS = free([
  { id: "caveat", label: "Handwriting 1" },
  { id: "shadows", label: "Handwriting 2" },
  { id: "homemade", label: "Handwriting 3" },
]);

export const INKS = free([
  { id: "navy", label: "Navy ink", color: "#2B3350" },
  { id: "red", label: "Red ink", color: "#B43A2A" },
  { id: "green", label: "Green ink", color: "#3F6B3A" },
  { id: "grey", label: "Grey ink", color: "#5F5F66" },
]);

export const STAMPS = free([
  { id: "tree", label: "Tree stamp" },
  { id: "hills", label: "Hills stamp" },
  { id: "calendar", label: "365 stamp" },
  { id: "heart", label: "Heart stamp" },
]);

export const WRAPS = free([
  { id: "candy", label: "Candy stripe" },
  { id: "dots", label: "Navy dots" },
  { id: "kraft", label: "Kraft" },
  { id: "gingham", label: "Gingham" },
  { id: "newsprint", label: "Newsprint" },
  { id: "stars", label: "Night stars" },
]);

export const RIBBONS = free([
  { id: "gold", label: "Gold ribbon", color: "#E8B93A" },
  { id: "red", label: "Red ribbon", color: "#C8432B" },
  { id: "cream", label: "Cream ribbon", color: "#F3EAD3" },
  { id: "navy", label: "Navy ribbon", color: "#2B3350" },
]);

/** Paid items are off until purchases exist. */
export const isAvailable = (item: { access: Access }) => item.access.kind === "free";

export const colorOf = (items: readonly { id: string; color: string }[], id: string) => (items.find((i) => i.id === id) ?? items[0]).color;
