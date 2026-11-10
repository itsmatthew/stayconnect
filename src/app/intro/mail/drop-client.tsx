"use client";

import { useEffect, useState } from "react";
import { DropSheet, type DropRow } from "@/components/mail/drop-sheet";
import { MailboxScene } from "@/components/mail/mailbox-scene";
import type { Friend } from "@/components/home/types";
import type { Placements } from "../circle/rings";
import type { Directory, FoundPerson } from "./directory";
import { checkDrop, type DropRecord } from "./drop-limits";
import { formatPhone, parseFindQuery } from "./find-query";
import type { DropOutcome, Mail, Share } from "./mail";

/** What a drop needs, gathered once by AppClient (docs/specs/mail.md). */
export type DropDeps = { directory: Directory; mail: Mail; share: Share; friends: readonly Friend[]; placements: Placements };

type DropClientProps = DropDeps & {
  photo: { id: string; src?: string; alt: string; takenAt: number };
  from: string;
  now: () => number;
  onClose: () => void;
};

const RING_WORDS: Readonly<Record<string, string>> = { nest: "in your nest", branches: "in your branches", bloom: "in your bloom" };
const INVITE_TEXT = "I dropped a photo in your mailbox on Now & Then.";
const shortDate = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const mutualLine = (p: FoundPerson) => `@${p.username} · ${p.mutual.count ? `${p.mutual.count} mutual · ${p.mutual.names.join(", ")}` : "no mutual friends"}`;

/** `accepts`: false when their "Who can drop in my mailbox" leaves you out (MAIL-10). A number is only known after the drop. */
type Picked = { row: DropRow; to: string; outside: boolean; label: string; accepts: boolean; face?: Extract<DropRow, { kind: "person" }> };
type Done = { outcome: Extract<DropOutcome, { kind: "mailbox" | "invite" }>; picked: Picked };

/** Drop it in a mailbox (docs/specs/mail.md): find someone, check the limits, drop, then the mailbox scene. */
export function DropClient({ photo, from, now, onClose, directory, mail, share, friends, placements }: DropClientProps) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<FoundPerson[]>([]);
  const [pickedKey, setPickedKey] = useState<string>();
  const [history, setHistory] = useState<DropRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();
  const [done, setDone] = useState<Done | null>(null);
  const q = parseFindQuery(query);

  useEffect(() => {
    void mail.history().then(setHistory);
  }, [mail]);
  useEffect(() => {
    let live = true;
    void directory.search(q).then((r) => live && setFound(r));
    return () => {
      live = false;
    };
    // The query object is rebuilt each render; the text is what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directory, query]);

  const friendRows: Picked[] =
    q.kind === "name"
      ? friends
          .filter((f) => f.name.toLowerCase().includes(q.text))
          .map((f) => ({ row: { kind: "person", key: `friend:${f.id}`, name: f.name, look: f.look, detail: RING_WORDS[placements[f.id]] ?? "on Now & Then" }, to: f.id, outside: false, label: f.name, accepts: true }))
      : [];
  const strangerRows: Picked[] = found
    .filter((p) => !friends.some((f) => f.id === p.id))
    .map((p) => ({ row: { kind: "person", key: `person:${p.id}`, name: p.name, look: p.look, detail: mutualLine(p) }, to: p.id, outside: true, label: p.name, accepts: p.canDrop }));
  const phoneRows: Picked[] = q.kind === "phone" ? [{ row: { kind: "phone", key: `phone:${q.phone}`, number: formatPhone(q.phone) }, to: q.phone, outside: true, label: "this number", accepts: true }] : [];
  const choices = [...phoneRows, ...friendRows, ...strangerRows];
  const picked = choices.find((c) => c.row.key === pickedKey);
  const check = picked && checkDrop(history, picked.outside, now());
  // Neutral on purpose: never says which setting they chose (MAIL-10).
  const limit =
    picked && !picked.accepts
      ? `${picked.label} isn't taking drops right now.`
      : check && !check.ok
        ? `You've dropped 3 photos outside your circle this week. You can send another on ${shortDate(check.until)}.`
        : undefined;

  const drop = async () => {
    if (!picked || limit) return;
    setBusy(true);
    setProblem(undefined);
    const to = picked.row.kind === "phone" ? { kind: "phone" as const, phone: picked.to } : { kind: "person" as const, id: picked.to };
    const outcome = await mail.drop({ to, photoId: photo.id, takenAt: photo.takenAt, from, at: now(), outside: picked.outside });
    setBusy(false);
    if (outcome.kind === "invitesUnavailable") return setProblem("They're not on Now & Then yet, and invites aren't open yet.");
    if (outcome.kind === "notAccepting") return setProblem(picked.row.kind === "phone" ? "This number isn't taking drops right now." : `${picked.label} isn't taking drops right now.`);
    if (outcome.kind === "invite") await share.share({ url: outcome.link, text: INVITE_TEXT });
    setDone({ outcome, picked });
  };

  if (done) {
    const { outcome, picked: p } = done;
    if (outcome.kind === "invite")
      return <MailboxScene flag="down" photo={photo} title="Waiting in their mailbox" line="It’ll be there when they join." onShareAgain={() => void share.share({ url: outcome.link, text: INVITE_TEXT })} onDone={onClose} />;
    const person = p.row.kind === "person" ? p.row : undefined;
    return (
      <MailboxScene
        flag="up"
        photo={photo}
        face={person && { id: person.key, name: person.name, look: person.look }}
        title={person ? `In ${person.name}’s mailbox` : "In their mailbox"}
        line={"Their mailbox will glow under their tree.\nNo friend request needed."}
        onDone={onClose}
      />
    );
  }

  return (
    <DropSheet
      photo={photo}
      query={query}
      onQuery={(v) => {
        setQuery(v);
        setPickedKey(undefined);
        setProblem(undefined);
      }}
      rows={choices.map((c) => c.row)}
      empty={q.kind === "name" || q.kind === "username" ? (choices.length ? undefined : "Nobody by that name on Now & Then.") : undefined}
      picked={pickedKey}
      onPick={setPickedKey}
      buttonLabel={!picked ? "Pick someone" : picked.row.kind === "phone" ? "Drop it in their mailbox" : `Drop in ${picked.label}’s mailbox`}
      canDrop={!!picked && !limit && !busy}
      note={limit ?? problem}
      onDrop={() => void drop()}
      onCancel={onClose}
    />
  );
}
