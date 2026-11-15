"use client";

import { useEffect, useMemo, useState } from "react";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup, Friend, Party } from "@/components/home/types";
import { ChatThread } from "@/components/messages/chat-thread";
import { MessagesScreen } from "@/components/messages/messages-screen";
import type { ChatRow, ThreadHeaderArt, ThreadMessage } from "@/components/messages/types";
import type { PhotoStore } from "../daily5/photo-store";
import { formatPhotoDate } from "../daily5/format";
import { friendParty, groupParty } from "../parties";
import {
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

type MessagesClientProps = {
  chat: ChatState;
  dispatch: (a: ChatAction) => void;
  now: () => number;
  store: PhotoStore | null;
  groups: readonly CircleGroup[];
  friends: readonly Friend[];
  /** What a recipient says when "simulate reply" fires (MSG-6). */
  replies: readonly string[];
  nav: NavProps;
};

export function MessagesClient({ chat, dispatch, now, store, groups, friends, replies, nav }: MessagesClientProps) {
  const [openId, setOpenId] = useState<string | null>(null);
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
    return (
      <Thread
        party={party}
        headerArt={headerArt(party, groupById)}
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
      />
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

/** A circle's header shows two of its own memories; a friend's, people then and now. */
function headerArt(party: Party, groups: Map<string, CircleGroup>): ThreadHeaderArt {
  const g = party.kind === "group" ? groups.get(party.id.slice("group:".length)) : undefined;
  return g ? [g.memories[0].art, g.memories[2].art] : ["people", "faces"];
}

type ThreadProps = {
  party: Party;
  headerArt: ThreadHeaderArt;
  messages: readonly ChatMessage[];
  delivered: boolean;
  store: PhotoStore | null;
  senderOf: (from: string) => ThreadMessage["sender"];
  onBack: () => void;
  onSendText: (text: string) => void;
};

function Thread({ messages, store, senderOf, ...rest }: ThreadProps) {
  const urls = usePhotoUrls(store, messages.flatMap((m) => (m.kind === "memory" ? [m.photoId] : [])));
  const view: ThreadMessage[] = messages.map((m, i) => {
    const mine = m.from === ME;
    const sender = !mine && messages[i - 1]?.from !== m.from ? senderOf(m.from) : undefined;
    return m.kind === "text"
      ? { id: m.id, mine, sender, kind: "text", text: m.text }
      : { id: m.id, mine, sender, kind: "memory", src: urls[m.photoId], dateLabel: formatPhotoDate(m.takenAt), note: m.note };
  });
  return <ChatThread {...rest} messages={view} />;
}

/** Object URLs for memory photos from the Daily 5 store, revoked when the thread closes. */
function usePhotoUrls(store: PhotoStore | null, ids: readonly string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!store || !key) return;
    let live = true;
    const made: string[] = [];
    Promise.all(
      key.split(",").map(async (id) => {
        const blob = await store.image(id);
        if (!blob) return [id, undefined] as const;
        const url = URL.createObjectURL(blob);
        made.push(url);
        return [id, url] as const;
      }),
    ).then((pairs) => {
      if (live) setUrls(Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => !!pair[1])));
    });
    return () => {
      live = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [store, key]);
  return urls;
}
