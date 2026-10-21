"use client";

import { useMemo, useState } from "react";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup, Friend, Party } from "@/components/home/types";
import { ChatThread } from "@/components/messages/chat-thread";
import { LogoSheet } from "@/components/messages/logo-sheet";
import { MessagesScreen } from "@/components/messages/messages-screen";
import type { ChatRow, ThreadMessage } from "@/components/messages/types";
import type { HeaderPane } from "@/components/shared/header-photo";
import type { PhotoStore } from "../daily5/photo-store";
import { formatPhotoDate } from "../daily5/format";
import { friendParty, groupParty } from "../parties";
import type { CropArea } from "../photo-file";
import { headerSlots } from "../profile/header-photos";
import { ProfileClient, type ProfileControls } from "../profile/profile-client";
import { usePickedPhoto } from "../use-picked-photo";
import {
  conversationId,
  hasNew,
  lastActivity,
  listOrder,
  ME,
  sealedCounts,
  showsDelivered,
  visibleMessages,
  type ChatAction,
  type ChatMessage,
  type ChatState,
} from "./conversations";
import { formatChatTime } from "./format";
import { usePhotoUrls } from "./use-photo-urls";

type MessagesClientProps = {
  chat: ChatState;
  dispatch: (a: ChatAction) => void;
  now: () => number;
  store: PhotoStore | null;
  groups: readonly CircleGroup[];
  friends: readonly Friend[];
  /** What a recipient says when "simulate reply" fires (MSG-6). */
  replies: readonly string[];
  /** A thread to open straight away, e.g. tapping someone in Your circle (docs/specs/circle.md, CIRCLE-6). */
  initialOpenId?: string | null;
  nav: NavProps;
  logos?: LogoControls;
  /** A group's profile, opened from its thread (docs/specs/group-profile.md). Without it, threads have no profile. */
  profile?: ProfileControls;
};

/** Changing a group's logo (docs/specs/group-logo.md, LOGO-4/5). `groups` already carry the changed logos. */
export type LogoControls = {
  lineOf: (groupId: string) => string | undefined;
  canUndo: (groupId: string) => boolean;
  onSave: (groupId: string, image: Blob) => void;
  onUndo: (groupId: string) => void;
  /** Downscales a picked photo before it's cropped. */
  decode: (f: File) => Promise<Blob>;
  /** Cuts the cropper's square out of the downscaled photo (LOGO-7). */
  crop: (image: Blob, area: CropArea | undefined, max: number) => Promise<Blob>;
};

/** Saved logos are at most this big (LOGO-4). */
const LOGO_MAX = 512;
const noLogos: LogoControls = { lineOf: () => undefined, canUndo: () => false, onSave: () => {}, onUndo: () => {}, decode: async (f) => f, crop: async (image) => image };

export function MessagesClient({ chat, dispatch, now, store, groups, friends, replies, initialOpenId = null, nav, logos = noLogos, profile }: MessagesClientProps) {
  const [logoOpen, setLogoOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const picked = usePickedPhoto(logos.decode);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const parties = useMemo(() => new Map<string, Party>([...groups.map(groupParty), ...friends.map(friendParty)].map((p) => [p.id, p])), [groups, friends]);
  const friendById = useMemo(() => new Map(friends.map((f) => [f.id, f])), [friends]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const preview = (m: ChatMessage | undefined, party: Party) => {
    if (!m) return undefined;
    const body = m.kind === "text" ? m.text : "sent a memory";
    if (m.from === ME) return `You: ${body}`;
    return party.kind === "group" ? `${friendById.get(m.from)?.name ?? "Someone"}: ${body}` : body;
  };
  const row = (party: Party): ChatRow => {
    const at = lastActivity(chat, party.id);
    return {
      conversationId: party.id,
      party,
      preview: preview(visibleMessages(chat, party.id).at(-1), party),
      time: at === undefined ? undefined : formatChatTime(at, now()),
      hasNew: hasNew(chat, party.id),
    };
  };

  const pinnedCircles = groups.filter((g) => g.closest).map((g) => row(groupParty(g)));
  const pinnedPeople = friends.filter((f) => f.closest).map((f) => row(friendParty(f)));
  const pinned = new Set([...pinnedCircles, ...pinnedPeople].map((r) => r.conversationId));
  const list = listOrder(chat, pinned).flatMap((id) => {
    const p = parties.get(id);
    return p ? [row(p)] : [];
  });

  const open = (id: string) => {
    dispatch({ type: "open", conversationId: id, at: now() });
    setProfileOpen(false);
    setOpenId(id);
  };

  const simulateReply = (conversationId: string) => {
    const [kind, id] = conversationId.split(":");
    const members = kind === "group" ? (groupById.get(id)?.members ?? []) : [id];
    const n = visibleMessages(chat, conversationId).length;
    dispatch({
      type: "receiveReply",
      id: crypto.randomUUID(),
      conversationId,
      from: members[n % members.length] ?? id,
      text: replies.length ? replies[n % replies.length] : "…",
      at: now(),
    });
  };

  const party = openId ? parties.get(openId) : undefined;
  if (openId && party) {
    const group = party.kind === "group" ? party : undefined;
    const groupId = group?.id.slice("group:".length);
    const circleGroup = groupId ? groupById.get(groupId) : undefined;
    const closeLogo = () => {
      picked.drop();
      setLogoOpen(false);
    };
    return (
      <>
        {profileOpen && group && circleGroup && profile ? (
          <ProfileClient
            group={circleGroup}
            party={group}
            chat={chat}
            friends={friends}
            store={store}
            now={now}
            controls={profile}
            onBack={() => setProfileOpen(false)}
            onChangeLogo={() => setLogoOpen(true)}
            onOpenFriend={(friendId) => open(conversationId("friend", friendId))}
          />
        ) : (
        <Thread
          party={party}
          panes={headerPanes(party, groupById)}
          messages={visibleMessages(chat, openId)}
          delivered={showsDelivered(chat, openId)}
          store={store}
          senderOf={(from) => {
            const f = friendById.get(from);
            return f && { name: f.name, look: f.look };
          }}
          onBack={() => {
            dispatch({ type: "open", conversationId: openId, at: now() });
            setOpenId(null);
          }}
          onSendText={(text) => dispatch({ type: "sendText", id: crypto.randomUUID(), conversationId: openId, text, at: now() })}
          onOpenProfile={group && profile ? () => setProfileOpen(true) : undefined}
        />
        )}
        {logoOpen && group && groupId && (
          <LogoSheet
            group={group}
            line={logos.lineOf(groupId)}
            canUndo={logos.canUndo(groupId)}
            preview={picked.pending?.url}
            onPickFile={picked.choose}
            onSave={async (area) => {
              const image = picked.pending?.image;
              closeLogo();
              if (image) logos.onSave(groupId, await logos.crop(image, area, LOGO_MAX));
            }}
            onUndo={() => logos.onUndo(groupId)}
            onCancel={closeLogo}
          />
        )}
      </>
    );
  }

  return (
    <MessagesScreen
      pinnedCircles={pinnedCircles}
      pinnedPeople={pinnedPeople}
      list={list}
      onOpen={open}
      sealed={sealedCounts(chat).map((x) => ({ ...x, name: parties.get(x.conversationId)?.name ?? x.conversationId }))}
      // Dev only (MSG-6): Next inlines NODE_ENV, so production builds drop the button entirely.
      onSimulateReply={process.env.NODE_ENV !== "production" ? simulateReply : undefined}
      nav={nav}
    />
  );
}

/** A circle's header is its first photo together and last time together (GP-12); a friend's, placeholder people now and then. */
function headerPanes(party: Party, groups: Map<string, CircleGroup>): readonly [HeaderPane, HeaderPane] {
  const g = party.kind === "group" ? groups.get(party.id.slice("group:".length)) : undefined;
  if (g) {
    const { first, last } = headerSlots(g);
    return [first.pane, last.pane];
  }
  return [
    { label: `${party.name} now`, art: "people" },
    { label: `${party.name} then`, art: "faces", faded: true },
  ];
}

type ThreadProps = {
  party: Party;
  panes: readonly [HeaderPane, HeaderPane];
  messages: readonly ChatMessage[];
  delivered: boolean;
  store: PhotoStore | null;
  senderOf: (from: string) => ThreadMessage["sender"];
  onBack: () => void;
  onSendText: (text: string) => void;
  onOpenProfile?: () => void;
};

function Thread({ messages, store, senderOf, ...rest }: ThreadProps) {
  const urls = usePhotoUrls(store, messages.flatMap((m) => (m.kind === "memory" ? [m.photoId] : [])));
  const view: ThreadMessage[] = messages.map((m, i) => {
    const mine = m.from === ME;
    const sender = !mine && messages[i - 1]?.from !== m.from ? senderOf(m.from) : undefined;
    return m.kind === "text"
      ? { id: m.id, mine, sender, kind: "text", text: m.text }
      : { id: m.id, mine, sender, kind: "memory", src: urls[m.photoId], ...(m.art ? { art: m.art } : {}), dateLabel: formatPhotoDate(m.takenAt), note: m.note };
  });
  return <ChatThread {...rest} messages={view} />;
}
