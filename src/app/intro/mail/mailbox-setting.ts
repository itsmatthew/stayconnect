// "Who can drop in my mailbox" (docs/specs/mail.md, MAIL-10). Plain TypeScript.

export const WHO_CAN_DROP = ["anyone", "friendsOfFriends", "circles"] as const;
export type WhoCanDrop = (typeof WHO_CAN_DROP)[number];
export const DEFAULT_WHO_CAN_DROP: WhoCanDrop = "anyone";

export const isWhoCanDrop = (v: unknown): v is WhoCanDrop => (WHO_CAN_DROP as readonly unknown[]).includes(v);

/** Your circles can always drop in. Friends of friends means at least one mutual friend. */
export function mailboxAllows(setting: WhoCanDrop, from: { inCircle: boolean; mutualCount: number }): boolean {
  if (from.inCircle || setting === "anyone") return true;
  return setting === "friendsOfFriends" && from.mutualCount > 0;
}

/** TODO(server): only the fake in `local-mailbox-setting.ts` exists, so the setting doesn't reach anyone else's drops yet. */
export interface MailboxSetting {
  /** Anyone unless changed. */
  load(): Promise<WhoCanDrop>;
  save(setting: WhoCanDrop): Promise<void>;
}
