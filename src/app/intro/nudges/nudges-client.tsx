"use client";

import { useEffect, useRef, useState } from "react";
import type { Ring } from "@/components/circle/types";
import type { Friend } from "@/components/home/types";
import { CheckInCard } from "@/components/nudges/check-in";
import { NudgesSettings } from "@/components/nudges/nudges-settings";
import { PICKED, ReachOutSent, ReachOutShare, ReachOutSheet, type ReachKind } from "@/components/nudges/reach-out";
import { photoDate } from "../daily5/photo-date";
import type { PhotoStore } from "../daily5/photo-store";
import { fileKey } from "../daily5/import-photos";
import type { Share } from "../mail/mail";
import { conversationId, type ChatAction, type ChatState } from "../messages/conversations";
import { usePhotoUrls } from "../messages/use-photo-urls";
import { usePickedPhoto } from "../use-picked-photo";
import { checkInReducer, MOODS, ROUGH_TEXT, type CheckInState, type Mood } from "./check-in";
import { ACTION_LABELS, reachOutPeople, sharedMemories, type ReachRow } from "./reach-out";
import { checkInDue, dueReachOut, passedSlots, weekKey } from "./schedule";
import { FREQ_NOTES, orderPeople, pickNote } from "./settings";
import type { NudgeAction, NudgeState } from "./state";

const MINUTE = 60_000;
const STARTERS: Record<ReachKind, readonly string[]> = {
  memory: ["remember when…", "still think about this", "we need to do this again"],
  throwback: ["remember when…", "still think about this", "we need to do this again"],
  plans: ["want to grab food this week?", "free this weekend?", "we should get something on the calendar"],
};

export type NudgeDeps = {
  state: NudgeState;
  loaded: boolean;
  dispatch: (a: NudgeAction) => void;
  now: () => number;
  friends: readonly Friend[];
  placements: Readonly<Record<string, Ring | undefined>>;
  chat: ChatState;
  chatDispatch: (a: ChatAction) => void;
  groups: readonly { id: string; name: string; members: readonly string[] }[];
  photos: PhotoStore | null;
  decode: (f: File) => Promise<Blob>;
  share: Share;
  /** Nothing else is showing (Circles, the intro over, no gift, tour or start-a-circle): a due nudge may come (NUDGE-8). */
  free: boolean;
};

type Open = { kind: "checkIn"; due: boolean; at: CheckInState } | { kind: "reach"; rows: ReachRow[]; done: string[]; flow?: Flow; sent?: string; slots: readonly string[] };
type Flow = { friendId: string; kind: ReachKind; selected?: string; note: string };

/**
 * The nudges that come by themselves (docs/specs/nudges.md, NUDGE-8 to NUDGE-17): the Sunday check-in first, then a due
 * reach-out nudge, one at a time, only while nothing else is showing. `checkInNow` opens the check-in at once (NUDGE-3).
 */
export function NudgesHost({ deps, checkInNow, onOpenSettings }: { deps: NudgeDeps; checkInNow: number; onOpenSettings: () => void }) {
  const { state, loaded, now, friends, chat } = deps;
  const [open, setOpen] = useState<Open | null>(null);
  const [asked, setAsked] = useState(checkInNow);
  // Due times pass while the app is open: look again every minute.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), MINUTE);
    return () => clearInterval(id);
  }, []);

  // "Check in now" (NUDGE-3): settled during render, like any other state change from a prop.
  if (checkInNow !== asked) {
    setAsked(checkInNow);
    setOpen({ kind: "checkIn", due: false, at: { step: "ask" } });
  }

  const t = now();
  if (!open && loaded && deps.free) {
    if (checkInDue(t, state.settings, state.log)) {
      setOpen({ kind: "checkIn", due: true, at: { step: "ask" } });
    } else if (friends.length && dueReachOut(t, state.settings, state.log)) {
      // With nobody to suggest yet, it stays due and may come later in the week.
      const rows = reachOutPeople(friends, chat, t);
      if (rows.length) setOpen({ kind: "reach", rows, done: [], slots: passedSlots(t, state.settings) });
    }
  }

  return <Showing open={open} setOpen={setOpen} deps={deps} onOpenSettings={onOpenSettings} />;
}

function Showing({ open, setOpen, deps, onOpenSettings }: { open: Open | null; setOpen: (o: Open | null) => void; deps: NudgeDeps; onOpenSettings: () => void }) {
  const { dispatch } = deps;
  // The sheet's slots, and every earlier one this week, are shown now, so missed ones never pile up (NUDGE-8).
  const slots = open?.kind === "reach" ? open.slots.join(",") : "";
  useEffect(() => {
    if (slots) dispatch({ type: "shown", slots: slots.split(",") });
  }, [slots, dispatch]);
  if (!open) return null;
  if (open.kind === "checkIn") return <CheckIn deps={deps} open={open} setOpen={setOpen} onOpenSettings={onOpenSettings} />;
  return <ReachOut deps={deps} open={open} setOpen={setOpen} />;
}

function CheckIn({ deps, open, setOpen, onOpenSettings }: { deps: NudgeDeps; open: Extract<Open, { kind: "checkIn" }>; setOpen: (o: Open | null) => void; onOpenSettings: () => void }) {
  const { state, dispatch, now, friends } = deps;
  const at = open.at;
  const week = weekKey(now());
  const byId = new Map(friends.map((f) => [f.id, f]));
  const people = state.settings.people.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const go = (next: CheckInState) => setOpen({ ...open, at: next });
  const close = () => {
    // Closing a due check-in before answering skips this week (NUDGE-13).
    if (at.step === "ask" && open.due) dispatch({ type: "checkIn", week, answer: "skipped" });
    setOpen(null);
  };
  return (
    <CheckInCard
      step={at.step}
      moods={MOODS}
      people={people}
      onAnswer={(mood: Mood) => {
        dispatch({ type: "checkIn", week, answer: mood });
        go(checkInReducer(at, { type: "answer", mood }));
      }}
      onTell={() => go(checkInReducer(at, { type: "tell" }))}
      onNotNow={() => go(checkInReducer(at, { type: "notNow" }))}
      onShare={() =>
        void deps.share.share({ text: ROUGH_TEXT }).then((r) => {
          if (r !== "cancelled") go(checkInReducer(at, { type: "shared" }));
        })
      }
      onPickPeople={() => {
        setOpen(null);
        onOpenSettings();
      }}
      onClose={close}
    />
  );
}

function ReachOut({ deps, open, setOpen }: { deps: NudgeDeps; open: Extract<Open, { kind: "reach" }>; setOpen: (o: Open | null) => void }) {
  const { friends, chat, now } = deps;
  const byId = new Map(friends.map((f) => [f.id, f]));
  const flow = open.flow;
  const shared = flow && flow.kind !== "plans" ? sharedMemories(flow.friendId, chat, deps.groups, flow.kind) : [];
  const urls = usePhotoUrls(deps.photos, shared.flatMap((m) => (m.art ? [] : [m.photoId])));
  const picked = usePickedPhoto(deps.decode);
  const file = useRef<File | null>(null);
  const [sending, setSending] = useState(false);

  if (open.sent) {
    const f = byId.get(open.sent)!;
    return (
      <ReachOutSent
        name={f.name}
        look={f.look}
        faces={open.rows.map((r) => ({ id: r.friendId, look: byId.get(r.friendId)!.look, done: open.done.includes(r.friendId) }))}
        onDone={() => setOpen({ ...open, sent: undefined })}
      />
    );
  }

  if (flow) {
    const f = byId.get(flow.friendId)!;
    const setFlow = (patch: Partial<Flow>) => setOpen({ ...open, flow: { ...flow, ...patch } });
    // A photo from your camera roll needs the photo store open to join My photos.
    const canSend = !sending && (flow.kind === "plans" ? !!flow.note.trim() : !!flow.selected && (flow.selected !== PICKED || (!!picked.pending && !!deps.photos)));
    const finish = () => {
      picked.drop();
      file.current = null;
      setSending(false);
      setOpen({ ...open, flow: undefined, done: [...open.done, flow.friendId], sent: flow.friendId });
    };
    const send = async () => {
      const to = conversationId("friend", flow.friendId);
      const at = now();
      if (flow.kind === "plans") {
        deps.chatDispatch({ type: "sendText", id: crypto.randomUUID(), conversationId: to, text: flow.note, at });
        return finish();
      }
      const memory = shared.find((m) => m.photoId === flow.selected);
      if (memory) {
        deps.chatDispatch({ type: "sendMemory", id: crypto.randomUUID(), conversationId: to, photoId: memory.photoId, takenAt: memory.takenAt, note: flow.note.trim(), at });
        return finish();
      }
      // From your camera roll: it joins My photos first, as Daily 5's pools hold your photos (NUDGE-10).
      const store = deps.photos;
      const image = picked.pending?.image;
      if (!store || !image || !file.current) return;
      setSending(true);
      const key = fileKey(file.current);
      const dating = await photoDate(file.current);
      const existing = (await store.has("mine", key)) ? (await store.list()).find((p) => p.pool === "mine" && p.fileKey === key) : undefined;
      const photoId = existing?.id ?? (await store.add({ pool: "mine", fileKey: key, ...dating, image }));
      deps.chatDispatch({ type: "sendMemory", id: crypto.randomUUID(), conversationId: to, photoId, takenAt: dating.takenAt, ...(dating.fileDated ? { fileDated: dating.fileDated } : {}), note: flow.note.trim(), at });
      finish();
    };
    return (
      <ReachOutShare
        kind={flow.kind}
        name={f.name}
        look={f.look}
        tiles={shared.map((m) => ({ id: m.photoId, src: urls[m.photoId], art: m.art, from: m.from }))}
        selected={flow.selected}
        onSelect={(id) => setFlow({ selected: id })}
        picked={picked.pending ? { src: picked.pending.url } : undefined}
        onPickFile={(f) => {
          file.current = f;
          void picked.choose(f);
          setFlow({ selected: PICKED });
        }}
        starters={STARTERS[flow.kind]}
        note={flow.note}
        onNote={(note) => setFlow({ note })}
        canSend={canSend}
        onSend={() => void send()}
        onBack={() => {
          picked.drop();
          file.current = null;
          setOpen({ ...open, flow: undefined });
        }}
      />
    );
  }

  return (
    <ReachOutSheet
      rows={open.rows.map((r) => {
        const f = byId.get(r.friendId)!;
        return { id: r.friendId, name: f.name, look: f.look, line: r.line, action: ACTION_LABELS[r.action], kind: r.action, done: open.done.includes(r.friendId) };
      })}
      onAction={(id) => {
        const row = open.rows.find((r) => r.friendId === id)!;
        setOpen({ ...open, flow: { friendId: id, kind: row.action, note: "" } });
      }}
      onClose={() => setOpen(null)}
    />
  );
}

/** Me → Nudges & check-ins (NUDGE-1 to NUDGE-6). */
export function NudgesSettingsClient({ deps, onCheckInNow, onBack }: { deps: Pick<NudgeDeps, "state" | "dispatch" | "friends" | "placements">; onCheckInNow: () => void; onBack: () => void }) {
  const { settings } = deps.state;
  const people = orderPeople(deps.friends, deps.placements).map((f) => ({ id: f.id, name: f.name, look: f.look, picked: settings.people.includes(f.id) }));
  return (
    <NudgesSettings
      people={people}
      pickNote={pickNote(people.filter((p) => p.picked).length)}
      onTogglePerson={(id) => deps.dispatch({ type: "person", id })}
      sunday={settings.sunday}
      onSunday={(on) => deps.dispatch({ type: "sunday", on })}
      onCheckInNow={onCheckInNow}
      perWeek={settings.perWeek}
      onPerWeek={(n) => deps.dispatch({ type: "perWeek", n })}
      freqNote={FREQ_NOTES[settings.perWeek]}
      quiet={settings.quiet}
      onQuiet={(on) => deps.dispatch({ type: "quiet", on })}
      onBack={onBack}
    />
  );
}
