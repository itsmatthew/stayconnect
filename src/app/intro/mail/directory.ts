// Finding people outside your circle to drop a photo for (docs/specs/mail.md, MAIL-3). Plain TypeScript.
import type { FindQuery } from "./find-query";
import { DEFAULT_WHO_CAN_DROP, mailboxAllows, type WhoCanDrop } from "./mailbox-setting";

export type FaceLook = { skin: string; hair: string; shirt: string; bg: string; ring: string };

/**
 * All anyone sees of someone found: no bio, no answers, nothing else from their profile. `canDrop` says whether their
 * "Who can drop in my mailbox" lets you in (MAIL-10), never which setting it is.
 */
export type FoundPerson = { id: string; name: string; username: string; look: FaceLook; mutual: { count: number; names: string[] }; canDrop: boolean };

/**
 * TODO(server): only the fake below exists. On the server, name search reads "Let people find me by name" (MAIL-7),
 * and phone numbers are matched as hashes.
 */
export interface Directory {
  /** Names and the start of a username match only people who allow it; an exact username matches anyone. A phone number lists nobody. */
  search(query: FindQuery): Promise<FoundPerson[]>;
  /** The account behind a number, used only when dropping, so typing a number never shows who's on the app. */
  accountFor(phone: string): Promise<string | undefined>;
  /** Whether this account's "Who can drop in my mailbox" lets you in (MAIL-10). */
  canDropTo(id: string): Promise<boolean>;
}

/** Someone outside your circle, as the fake knows them. `mailbox` is their setting, anyone if left out. */
export type DirectoryEntry = Omit<FoundPerson, "mutual" | "canDrop"> & { phone: string; findableByName: boolean; mutual: string[]; mailbox?: WhoCanDrop };

/** A directory in memory, from the demo's people. */
export function fakeDirectory(people: readonly DirectoryEntry[]): Directory {
  // Everyone here is outside your circle; your circle is matched from your own friends (MAIL-3).
  const allows = (p: DirectoryEntry) => mailboxAllows(p.mailbox ?? DEFAULT_WHO_CAN_DROP, { inCircle: false, mutualCount: p.mutual.length });
  const card = (p: DirectoryEntry): FoundPerson => ({ id: p.id, name: p.name, username: p.username, look: p.look, mutual: { count: p.mutual.length, names: p.mutual.slice(0, 3) }, canDrop: allows(p) });
  return {
    async search(q) {
      if (q.kind !== "name" && q.kind !== "username") return [];
      const text = q.kind === "name" ? q.text : q.username;
      // Finishing a partial username only for people who allow it, so hidden people can't be found letter by letter (MAIL-7).
      const matches = (p: DirectoryEntry) => p.username === text || (p.findableByName && (p.username.startsWith(text) || (q.kind === "name" && p.name.toLowerCase().includes(text))));
      return people.filter(matches).map(card);
    },
    accountFor: async (phone) => people.find((p) => p.phone === phone)?.id,
    canDropTo: async (id) => {
      const p = people.find((e) => e.id === id);
      return !p || allows(p);
    },
  };
}
