// What a gift can be made from, named and colored as in the design (design-ref/project/GiftCompose.dc.html;
// docs/specs/gifts.md, GIFT-10). Every item says whether it's free or paid, so one can become paid later without
// changing saved gifts. All are free for now. Plain TypeScript.

export type Access = { kind: "free" } | { kind: "paid"; sku: string };
export type CatalogItem = { id: string; label: string; access: Access };

const FREE: Access = { kind: "free" };
const free = <T extends { id: string; label: string }>(items: readonly T[]): (T & { access: Access })[] => items.map((i) => ({ ...i, access: FREE }));

/** "month" is named for the month it's sent in (`monthFrameLabel`). TODO(design): only November is drawn; every month uses it until the others are. */
export const FRAMES = free([
  { id: "classic", label: "Classic", blurb: "clean white border" },
  { id: "instant", label: "Instant", blurb: "room to write the date" },
  { id: "album", label: "Album", blurb: "tucked into photo corners" },
  { id: "film", label: "Film", blurb: "one frame off the roll" },
  { id: "wood", label: "Wood", blurb: "framed like it’s on a shelf" },
  { id: "month", label: "November", blurb: "changes with the month" },
]);

export const HANDS = free([
  { id: "pen", label: "Pen" },
  { id: "pencil", label: "Pencil" },
  { id: "script", label: "Script" },
]);

export const INKS = free([
  { id: "navy", label: "Navy", color: "#2B3350" },
  { id: "red", label: "Red", color: "#A8331F" },
  { id: "green", label: "Green", color: "#3E6B2C" },
  { id: "graphite", label: "Graphite", color: "#5A5B61" },
]);

export const STAMPS = free([
  { id: "tree", label: "Tree" },
  { id: "sunrise", label: "Sunrise" },
  { id: "calendar", label: "365" },
  { id: "heart", label: "Heart" },
]);

export const WRAPS = free([
  { id: "candy", label: "Candy stripe" },
  { id: "dots", label: "Gold dots" },
  { id: "kraft", label: "Kraft" },
  { id: "gingham", label: "Gingham" },
  { id: "newsprint", label: "Newsprint" },
  { id: "stars", label: "Night sky" },
]);

export const RIBBONS = free([
  { id: "gold", label: "Gold", color: "#F2BE4A" },
  { id: "red", label: "Red", color: "#C8402D" },
  { id: "cream", label: "Cream", color: "#F4EFE6" },
  { id: "navy", label: "Navy", color: "#2B3350" },
]);

/** Paid items are off until purchases exist. */
export const isAvailable = (item: { access: Access }) => item.access.kind === "free";

export const colorOf = (items: readonly { id: string; color: string }[], id: string) => (items.find((i) => i.id === id) ?? items[0]).color;
