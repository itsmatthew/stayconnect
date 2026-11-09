// Finding people outside your circle to drop a photo for (docs/specs/mail.md, MAIL-3). Plain TypeScript.
import type { FindQuery } from "./find-query";

export type FaceLook = { skin: string; hair: string; shirt: string; bg: string; ring: string };

/** All anyone sees of someone found: no bio, no answers, nothing else from their profile. */
export type FoundPerson = { id: string; name: string; username: string; look: FaceLook; mutual: { count: number; names: string[] } };

/**
 * TODO(server): only the fake below exists. On the server, name search reads "Let people find me by name" (MAIL-7),
 * and phone numbers are matched as hashes.
 */
export interface Directory {
  /** Names match only people who allow it; an exact username matches anyone. A phone number lists nobody. */
  search(query: FindQuery): Promise<FoundPerson[]>;
  /** The account behind a number, used only when dropping, so typing a number never shows who's on the app. */
  accountFor(phone: string): Promise<string | undefined>;
}

export type DirectoryEntry = FoundPerson extends infer P ? Omit<P & { phone: string; findableByName: boolean }, "mutual"> & { mutual: string[] } : never;

/** A directory in memory, from the demo's people. */
export function fakeDirectory(people: readonly DirectoryEntry[]): Directory {
  const card = ({ id, name, username, look, mutual }: DirectoryEntry): FoundPerson => ({ id, name, username, look, mutual: { count: mutual.length, names: mutual.slice(0, 3) } });
  return {
    async search(q) {
      if (q.kind === "username") return people.filter((p) => p.username === q.username).map(card);
      if (q.kind !== "name") return [];
      const byUsername = people.filter((p) => p.username === q.text);
      const byName = people.filter((p) => p.findableByName && p.name.toLowerCase().includes(q.text) && !byUsername.includes(p));
      return [...byUsername, ...byName].map(card);
    },
    accountFor: async (phone) => people.find((p) => p.phone === phone)?.id,
  };
}
