"use client";

import { useEffect, useReducer, useRef } from "react";
import { seedConversations } from "../placeholder-data";
import { chatReducer, initialChatState, type ChatAction, type ChatState } from "./conversations";

// TODO(re-evaluate when chats come from the database): localStorage stands in for the server (MSG-7).
export const CHAT_STORAGE_KEY = "nowandthen.chat.v1";

function load(): ChatState | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatState) : null;
  } catch {
    return null;
  }
}

/**
 * Chat state shared by Daily 5 (sending) and Messages (reading), kept in localStorage.
 * Starts from the seed so server and client render alike, then loads the saved state after mount.
 */
export function useChat(now: () => number): [ChatState, (a: ChatAction) => void] {
  const [state, dispatch] = useReducer(chatReducer, undefined, () => initialChatState(seedConversations(now())));
  const mounted = useRef(false);

  useEffect(() => {
    const saved = load();
    if (saved) dispatch({ type: "load", state: saved });
  }, []);

  useEffect(() => {
    // Skip the first run: that's the seed, before the saved state has loaded.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, dispatch];
}
