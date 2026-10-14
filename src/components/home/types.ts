/** Stand-in "photo" art drawn inside ornaments and card thumbnails. */
export type ArtKind = "city" | "churro" | "faces" | "people" | "cookie" | "sunset" | "basketball";

export type Palette = {
  canopy: string;
  shade: string;
  highlight: string;
  /** Ornament rim, tinted toward the canopy. */
  rim: string;
};

export type Memory = { id: string; art: ArtKind; caption: string };

export type CircleGroup = {
  id: string;
  name: string;
  palette: Palette;
  friendCount: number;
  memories: readonly [Memory, Memory, Memory];
  lastMemory: string;
};
