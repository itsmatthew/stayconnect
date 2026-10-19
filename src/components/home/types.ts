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
  /** One of the user's 3–5 closest circles: pinned to the front of home and messages. */
  closest: boolean;
  /** Friend ids. */
  members: readonly string[];
  friendCount: number;
  memories: readonly [Memory, Memory, Memory];
  lastMemory: string;
};

/** A placeholder face, drawn as layered radial gradients like the reference's avatars. */
export type FriendLook = { skin: string; hair: string; shirt: string; bg: string; ring: string };

export type Friend = { id: string; name: string; closest: boolean; look: FriendLook };

/** Someone you can chat with or send a memory to: a group or a single friend. `id` is the conversation id. */
export type Party =
  | { kind: "group"; id: string; name: string; closest: boolean; palette: Palette }
  | { kind: "friend"; id: string; name: string; closest: boolean; look: FriendLook };
