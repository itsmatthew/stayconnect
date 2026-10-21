/** Stand-in "photo" art drawn inside ornaments and card thumbnails. */
export type ArtKind = "city" | "churro" | "faces" | "people" | "cookie" | "sunset" | "basketball";

export type Palette = {
  canopy: string;
  shade: string;
  highlight: string;
  /** Ornament rim, tinted toward the canopy. */
  rim: string;
};

/** `src`: a photo a member put on this ornament (docs/specs/home.md, HOME-15); without one, the art is drawn. `caption` may be "". */
export type Memory = { id: string; art: ArtKind; caption: string; src?: string };

export type CircleGroup = {
  id: string;
  name: string;
  palette: Palette;
  /** One of the user's 3–5 closest circles: pinned to the front of home and messages. */
  closest: boolean;
  /** Friend ids. */
  members: readonly string[];
  /** Members who see everyone's Archive posts without posting (docs/specs/archive.md, ARC-5). */
  viewers?: readonly string[];
  friendCount: number;
  memories: readonly [Memory, Memory, Memory];
  lastMemory: string;
  /** A logo image a member chose (docs/specs/group-logo.md, LOGO-4); without one, the logo is the initials. */
  logo?: string;
};

/** A placeholder face, drawn as layered radial gradients like the reference's avatars. */
export type FriendLook = { skin: string; hair: string; shirt: string; bg: string; ring: string };

export type Friend = { id: string; name: string; closest: boolean; look: FriendLook };

/** Someone you can chat with or send a memory to: a group or a single friend. `id` is the conversation id. */
export type Party =
  | { kind: "group"; id: string; name: string; closest: boolean; palette: Palette; /** LOGO-1 */ initials: string; logo?: string }
  | { kind: "friend"; id: string; name: string; closest: boolean; look: FriendLook };
