import type { InboxState, InboxStore } from "./inbox";

/** Demo data keeps its own mailbox (docs/specs/demo.md, DEMO-3). */
export const inboxKey = (suffix: string) => `nowandthen.inbox.v1${suffix}`;

/** TODO(server): a fake, kept in this browser. Nothing is sent anywhere, reports included. */
export function localInbox(suffix: string): InboxStore {
  const key = inboxKey(suffix);
  return {
    load: async () => {
      try {
        const raw = localStorage.getItem(key);
        const v: unknown = raw && JSON.parse(raw);
        return v && typeof v === "object" && Array.isArray((v as InboxState).letters) ? (v as InboxState) : undefined;
      } catch {
        return undefined;
      }
    },
    save: async (state) => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Blocked: the mailbox still works until the app closes.
      }
    },
  };
}
