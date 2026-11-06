"use client";

import { useState } from "react";
import type { CircleGroup, Friend, Party } from "@/components/home/types";
import { ColorSheet } from "@/components/profile/color-sheet";
import { GoalSheet } from "@/components/profile/goal-sheet";
import { RenameSheet } from "@/components/profile/rename-sheet";
import { GroupProfile } from "@/components/profile/group-profile";
import { OrnamentView } from "@/components/profile/ornament-view";
import { AllPhotos } from "@/components/profile/photo-grid";
import type { HeaderSlotName, NextGoal, ProfileMember, ProfilePhoto, UpToRow } from "@/components/profile/types";
import type { Placements } from "../circle/rings";
import type { ColorOverrides } from "../colors/color-overrides";
import { GROUP_COLORS, groupPalette } from "../colors/palette";
import type { PhotoStore } from "../daily5/photo-store";
import { canRename, renameError } from "../group-names/group-names";
import { formatPhotoDate } from "../daily5/format";
import { ME, visibleMessages, type ChatState } from "../messages/conversations";
import { usePhotoUrls } from "../messages/use-photo-urls";
import { OrnamentSheetClient, type OrnamentControls } from "../ornaments/ornament-sheet-client";
import { GOAL_LABEL_MAX, activeGoal, dayCount, daysUntil, formatGoalDate, pastGoal, type GoalAction, type GoalState } from "./goals";
import { headerSlots } from "./header-photos";
import { thenMemory, type MemoryMessage } from "./then-memory";

/** What the profile needs beyond the chat (docs/specs/group-profile.md). AppClient builds it. */
export type ProfileControls = {
  goals: GoalState;
  dispatchGoal: (a: GoalAction) => void;
  /** Your circle: who the user has placed in a ring (GP-3). */
  placements: Placements;
  upTo: Readonly<Record<string, readonly UpToRow[]>>;
  ornaments: OrnamentControls;
  /** This viewer's own group colors; `null` clears one (docs/specs/group-colors.md, COLOR-7). */
  colors: { overrides: ColorOverrides; onChange: (groupId: string, colorId: string | null) => void };
  /** Renames a group; rejects if it couldn't be saved (docs/specs/group-rename.md, RENAME-4). */
  rename: (groupId: string, raw: string) => Promise<void>;
  /** Saves a picked photo as a header photo, with its capture date (GP-12). */
  setHeaderPhoto: (groupId: string, slot: HeaderSlotName, file: File) => Promise<void>;
};

type ProfileClientProps = {
  group: CircleGroup;
  party: Extract<Party, { kind: "group" }>;
  chat: ChatState;
  friends: readonly Friend[];
  store: PhotoStore | null;
  now: () => number;
  controls: ProfileControls;
  onBack: () => void;
  onChangeLogo: () => void;
  /** Opens the user's 1:1 chat with someone in their circle. */
  onOpenFriend: (friendId: string) => void;
};

/** The grid shows this many; "See all" loads this many at a time (GP-5). */
const RECENT = 9;
const PAGE = 24;

const SWATCHES = GROUP_COLORS.map(({ id, label }) => ({ id, label, color: groupPalette(id, 0).canopy }));

const photoOf = (m: MemoryMessage, urls: Record<string, string>): ProfilePhoto => ({
  id: m.id,
  label: `Photo from ${formatPhotoDate(m.takenAt)}`,
  ...(urls[m.photoId] ? { src: urls[m.photoId] } : {}),
  ...(m.art ? { art: m.art } : {}),
});

/** A group's profile, wired: members, ornaments, photos, then and next (docs/specs/group-profile.md). */
export function ProfileClient({ group, party, chat, friends, store, now, controls, onBack, onChangeLogo, onOpenFriend }: ProfileClientProps) {
  const [viewing, setViewing] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  /** How many "See all" shows; null when it's closed. */
  const [allShown, setAllShown] = useState<number | null>(null);

  const at = now();
  // Visible only: sealed memories never reach the profile (GP-5/6).
  const visible = visibleMessages(chat, party.id);
  const memories = visible.filter((m): m is MemoryMessage => m.kind === "memory").sort((a, b) => b.at - a.at);
  const then = thenMemory(visible, at);
  const shown = memories.slice(0, Math.max(RECENT, allShown ?? 0));
  const urls = usePhotoUrls(store, [...shown, ...(then ? [then.message] : [])].map((m) => m.photoId));

  const friendById = new Map(friends.map((f) => [f.id, f]));
  const you: ProfileMember = { id: ME, name: "You" };
  const others: ProfileMember[] = group.members.flatMap((id) => {
    const f = friendById.get(id);
    if (!f) return [];
    // Only people in Your circle open a chat for now. TODO(re-evaluate when the Me profile is built): open their profile.
    return [{ id, name: f.name, look: f.look, ...(controls.placements[id] ? { onOpen: () => onOpenFriend(id) } : {}) }];
  });
  const members = [you, ...others];

  const goal = activeGoal(controls.goals, group.id, at);
  const byId = new Map(members.map((m) => [m.id, m]));
  const next: NextGoal | undefined = goal && {
    label: goal.label,
    ...(goal.date ? { count: dayCount(daysUntil(goal.date, at)), dateLabel: formatGoalDate(goal.date) } : {}),
    going: goal.in.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
    total: members.length,
    mineIn: goal.in.includes(ME),
  };

  // After a goal's date, the right half asks how it went; answering either way clears the goal (GP-12).
  const past = pastGoal(controls.goals, group.id, at);
  const endPast = () => controls.dispatchGoal({ type: "clear", groupId: group.id });

  const ornament = viewing === null ? undefined : group.memories[viewing];
  return (
    <>
      <GroupProfile
        party={party}
        members={members}
        ornaments={group.memories}
        photos={memories.slice(0, RECENT).map((m) => photoOf(m, urls))}
        hasMore={memories.length > RECENT}
        then={then && { photo: photoOf(then.message, urls), yearsAgo: then.yearsAgo }}
        goal={next}
        upTo={controls.upTo[group.id] ?? []}
        header={{ ...headerSlots(group), ...(past ? { prompt: `How was ${past.label}? Add a photo from it` } : {}) }}
        onPickHeader={(slot, file) => void controls.setHeaderPhoto(group.id, slot, file)}
        onPickPrompt={(file) => {
          endPast();
          void controls.setHeaderPhoto(group.id, "last", file);
        }}
        onDismissPrompt={endPast}
        onBack={onBack}
        onChangeLogo={onChangeLogo}
        onChangeColor={() => setColorOpen(true)}
        onRename={() => setRenameOpen(true)}
        onViewOrnament={setViewing}
        onAddOrnament={setEditing}
        onSeeAll={() => setAllShown(PAGE)}
        onEditGoal={() => setGoalOpen(true)}
        onToggleIn={() => controls.dispatchGoal({ type: next?.mineIn ? "leave" : "join", groupId: group.id, who: ME })}
      />
      {renameOpen && (
        <RenameSheet
          current={group.name}
          canSave={(raw) => canRename(raw, group.name)}
          errorFor={renameError}
          onSave={(raw) => controls.rename(group.id, raw).then(() => setRenameOpen(false))}
          onCancel={() => setRenameOpen(false)}
        />
      )}
      {colorOpen && (
        <ColorSheet
          groupName={group.name}
          swatches={SWATCHES}
          selected={controls.colors.overrides[group.id] ?? group.colorId}
          overridden={group.id in controls.colors.overrides}
          onPick={(colorId) => {
            controls.colors.onChange(group.id, colorId);
            setColorOpen(false);
          }}
          onReset={() => {
            controls.colors.onChange(group.id, null);
            setColorOpen(false);
          }}
          onCancel={() => setColorOpen(false)}
        />
      )}
      {allShown !== null && (
        <AllPhotos
          title="All photos"
          photos={memories.slice(0, allShown).map((m) => photoOf(m, urls))}
          hasMore={memories.length > allShown}
          onMore={() => setAllShown((n) => (n ?? 0) + PAGE)}
          onBack={() => setAllShown(null)}
        />
      )}
      {ornament && viewing !== null && (
        <OrnamentView
          groupName={group.name}
          index={viewing}
          memory={ornament}
          rim={group.palette.rim}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onClose={() => setViewing(null)}
        />
      )}
      {editing !== null && <OrnamentSheetClient group={group} index={editing} controls={controls.ornaments} onClose={() => setEditing(null)} />}
      {goalOpen && (
        <GoalSheet
          current={goal && { label: goal.label, date: goal.date }}
          labelMax={GOAL_LABEL_MAX}
          onSave={(label, date) => {
            controls.dispatchGoal({ type: "set", groupId: group.id, label, date, by: ME });
            setGoalOpen(false);
          }}
          onClear={() => {
            controls.dispatchGoal({ type: "clear", groupId: group.id });
            setGoalOpen(false);
          }}
          onCancel={() => setGoalOpen(false)}
        />
      )}
    </>
  );
}
