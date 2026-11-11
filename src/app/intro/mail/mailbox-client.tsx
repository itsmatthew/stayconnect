"use client";

import { useState, type ReactNode } from "react";
import type { ArtKind } from "@/components/home/types";
import { KeptSheet } from "@/components/mail/kept-sheet";
import { MailMenu } from "@/components/mail/mail-menu";
import { MailNote } from "@/components/mail/mail-note";
import type { EnvelopeView, MailItemView } from "@/components/mail/mail-types";
import { MailViewer } from "@/components/mail/mail-viewer";
import { PhotoZoom } from "@/components/mail/photo-zoom";
import { envelopes, inboxReducer, keptGroups, mailboxLabel, newCount, type InboxAction, type InboxState, type Letter, type MailSender } from "./inbox";

const ARTS: readonly ArtKind[] = ["city", "churro", "faces", "people", "cookie", "sunset", "basketball"];
const asArt = (art: string): ArtKind => (ARTS as readonly string[]).includes(art) ? (art as ArtKind) : "people";
const fmt = (t: number, o: Intl.DateTimeFormatOptions) => new Date(t).toLocaleDateString("en-US", o);

const view = (l: Letter): MailItemView => ({
  id: l.id,
  fromName: l.from.name,
  art: asArt(l.photo.art),
  photoDate: fmt(l.takenAt, { month: "short", day: "numeric", year: "numeric" }),
  sentDay: fmt(l.sentAt, { month: "short", day: "numeric" }),
  postmark: [fmt(l.sentAt, { month: "short", day: "numeric" }).toUpperCase(), String(new Date(l.sentAt).getFullYear())],
});

/** TODO(server): stands in for someone outside your circle until real mail arrives. Shown only by the dev control. */
const TEST_STRANGER: MailSender = { id: "test-stranger", name: "Riley Test", look: { skin: "#E8B48C", hair: "#3B2A1E", shirt: "#4F8F8B", bg: "#CFE0D4", ring: "#4F8F8B" }, inCircle: false };

type Screen = { kind: "closed" } | { kind: "new"; index: number; opened: boolean; photo: number } | { kind: "kept" };

type MailboxDeps = {
  state: InboxState;
  dispatch: (a: InboxAction) => void;
  now: () => number;
  /** Written on the envelope. */
  recipientName?: string;
  /** People in your circle the dev control can send as. */
  circle: readonly MailSender[];
};

/**
 * Your mailbox (docs/specs/mailbox.md): what the tree's mailbox shows, and the screens it opens. Done keeps a photo,
 * closing leaves the rest new, and ⋯ removes, blocks or reports. Nothing here ever reaches the sender.
 */
export function useMailbox({ state, dispatch, now, recipientName, circle }: MailboxDeps): { tree: { count: number; label: string; onOpen: () => void }; screens: ReactNode } {
  const [screen, setScreen] = useState<Screen>({ kind: "closed" });
  const [zoom, setZoom] = useState<Letter | null>(null);
  const [menu, setMenu] = useState<Letter | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [devSent, setDevSent] = useState(0);

  const envs = envelopes(state);
  const count = newCount(state);
  const byId = new Map(state.letters.map((l) => [l.id, l]));
  const close = (after?: string) => {
    setScreen({ kind: "closed" });
    setNote(after ?? null);
  };
  // After mail leaves the new pile, stay on the same place in the line, or close once it's all read.
  const settle = (after: InboxState, message?: string) => {
    const left = envelopes(after);
    if (screen.kind !== "new") return message && setNote(message);
    if (!left.length) return close(message ?? "All caught up. Tap your mailbox to see old mail.");
    setScreen({ kind: "new", index: Math.min(screen.index, left.length - 1), opened: false, photo: 0 });
    if (message) setNote(message);
  };
  const act = (a: InboxAction, message?: string) => {
    dispatch(a);
    // The reducer is pure, so the next state can be worked out here too.
    settle(inboxReducer(state, a), message);
  };

  const onMenuAction = (kind: "remove" | "block" | "report") => {
    const l = menu;
    if (!l) return;
    setMenu(null);
    setZoom(null);
    if (kind === "remove") act({ type: "remove", ids: [l.id] }, "Removed from your mailbox.");
    if (kind === "block") act({ type: "block", personId: l.from.id }, `${l.from.name} is blocked. Their photos won't reach you.`);
    // TODO(server): a report goes nowhere until there's somewhere to send it.
    if (kind === "report") act({ type: "report", letterId: l.id, at: now() }, "Thanks for telling us. We'll take a look.");
  };

  const envViews: EnvelopeView[] = envs.map((e) => ({ key: e.key, fromName: e.from.name, items: e.letters.map(view) }));
  const zoomTo = (item: MailItemView) => setZoom(byId.get(item.id) ?? null);
  const menuFor = (item: MailItemView) => setMenu(byId.get(item.id) ?? null);

  const screens = (
    <>
      {screen.kind === "new" && envs.length > 0 && (
        <MailViewer
          subtitle={`${count} new`}
          envelopes={envViews}
          index={screen.index}
          opened={screen.opened}
          photoIndex={screen.photo}
          recipientName={recipientName}
          onPrev={() => setScreen({ kind: "new", index: Math.max(0, screen.index - 1), opened: false, photo: 0 })}
          onNext={() => setScreen({ kind: "new", index: Math.min(envs.length - 1, screen.index + 1), opened: false, photo: 0 })}
          onOpen={() => setScreen({ ...screen, opened: true, photo: 0 })}
          onNextPhoto={() => setScreen({ ...screen, photo: screen.photo + 1 })}
          onDone={() => act({ type: "keep", ids: envs[screen.index].letters.map((l) => l.id) })}
          onZoom={zoomTo}
          onMenu={menuFor}
          onClose={() => close()}
        />
      )}
      {screen.kind === "kept" && <KeptSheet groups={keptGroups(state, now()).map((g) => ({ label: g.label, items: g.letters.map(view) }))} onZoom={zoomTo} onClose={() => close()} />}
      {zoom && <PhotoZoom item={view(zoom)} onClose={() => setZoom(null)} onMenu={() => setMenu(zoom)} />}
      {menu && <MailMenu fromName={menu.from.name} onRemove={() => onMenuAction("remove")} onBlock={() => onMenuAction("block")} onReport={() => onMenuAction("report")} onCancel={() => setMenu(null)} />}
      {note && <MailNote text={note} onDismiss={() => setNote(null)} />}
      {/* Dev only (Next inlines NODE_ENV, so production drops it): receive a drop to test the mailbox (MAILBOX-8). */}
      {process.env.NODE_ENV !== "production" && screen.kind === "closed" && (
        <button
          type="button"
          onClick={() => {
            const senders = [TEST_STRANGER, ...circle.slice(0, 2)];
            const from = senders[devSent % senders.length];
            const at = now();
            setDevSent(devSent + 1);
            dispatch({ type: "receive", letter: { id: `test-${at}-${devSent}`, from, photo: { kind: "art", art: ARTS[devSent % ARTS.length] }, takenAt: at - 3 * 365 * 86_400_000, sentAt: at, status: "new" } });
          }}
          aria-label="Receive a test drop"
          title="Receive a test drop (dev only)"
          style={{ position: "fixed", left: 4, top: 200, zIndex: 45, width: 44, height: 44, padding: 0, border: "1.5px dashed #2B3350", borderRadius: 22, background: "rgba(255,248,236,.85)", color: "#2B3350", font: "800 13px system-ui, sans-serif", cursor: "pointer" }}
        >
          ✉+
        </button>
      )}
    </>
  );

  return {
    tree: {
      count,
      label: mailboxLabel(count),
      onOpen: () => {
        setNote(null);
        setScreen(count ? { kind: "new", index: 0, opened: false, photo: 0 } : { kind: "kept" });
      },
    },
    screens,
  };
}
