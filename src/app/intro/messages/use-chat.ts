"use client";

import { useEffect, useReducer, useRef } from "react";
import { chatReducer, initialChatState, type ChatAction, type ChatState, type Conversation } from "./conversations";

// TODO(re-evaluate when chats come from the database): localStorage stands in for the server (MSG-7).
/** Demo data saves under its own key, so it never mixes with real chats (docs/specs/demo.md, DEMO-3). */
export const chatStorageKey = (suffix: string) => `nowandthen.chat.v1${suffix}`;

function load(key: string): ChatState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ChatState) : null;
  } catch {
    return null;
  }
}

/**
 * Chat state shared by Daily 5 (sending) and Messages (reading), kept in localStorage.
 * Starts from the seed so server and client render alike, then loads the saved state after mount.
 */
export function useChat(
  now: () => number,
  seed: (now: number) => Conversation[],
  storageSuffix: string,
): [ChatState, (a: ChatAction) => void] {
  const key = chatStorageKey(storageSuffix);
  const [state, dispatch] = useReducer(chatReducer, undefined, () => initialChatState(seed(now())));
  const mounted = useRef(false);

  useEffect(() => {
    const saved = load(key);
    if (saved) dispatch({ type: "load", state: saved });
  }, [key]);

  useEffect(() => {
    // Skip the first run: that's the seed, before the saved state has loaded.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, dispatch];
}
