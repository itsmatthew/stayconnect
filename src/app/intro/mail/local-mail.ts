import type { Directory } from "./directory";
import type { DropRecord } from "./drop-limits";
import type { Invites, Mail } from "./mail";

/** Demo data keeps its own record (docs/specs/demo.md, DEMO-3). */
export const dropsKey = (suffix: string) => `nowandthen.drops.v1${suffix}`;

/**
 * TODO(server): a fake. It records each drop in this browser, asks the directory whether a number has an account,
 * and makes an invite when it doesn't. Nobody else receives anything.
 */
export function localMail(suffix: string, directory: Directory, invites: Invites, { invitesEnabled }: { invitesEnabled: boolean }): Mail {
  const key = dropsKey(suffix);
  const read = (): (DropRecord & { id: string })[] => {
    try {
      const v: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  return {
    async drop(req) {
      const account = req.to.kind === "person" ? req.to.id : await directory.accountFor(req.to.phone);
      if (!account && !invitesEnabled) return { kind: "invitesUnavailable" };
      const id = `${req.at}-${Math.random().toString(36).slice(2, 8)}`;
      const to = account ?? (req.to.kind === "phone" ? req.to.phone : "");
      localStorage.setItem(key, JSON.stringify([...read(), { id, to, at: req.at, outside: req.outside, photoId: req.photoId }]));
      if (account) return { kind: "mailbox" };
      const { link } = await invites.create({ phone: to, dropId: id });
      return { kind: "invite", link };
    },
    history: async () => read().map(({ to, at, outside }) => ({ to, at, outside })),
  };
}

/** TODO(server): a fake invite. The link's landing page is issue #26's, so it goes nowhere yet. */
export function localInvites(origin: string): Invites {
  return { create: async () => ({ link: `${origin}/invite/${Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join("")}` }) };
}
