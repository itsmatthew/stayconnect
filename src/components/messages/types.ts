import type { ArtKind, FriendLook, Party } from "../home/types";

/** One chat on the recents screen. */
export type ChatRow = { conversationId: string; party: Party; preview?: string; time?: string; hasNew: boolean };

export type ThreadSender = { name: string; look: FriendLook };

type ThreadBase = { id: string; mine: boolean; /** Others' messages in groups: who said it, shown when the sender changes. */ sender?: ThreadSender };
export type ThreadMessage =
  | (ThreadBase & { kind: "text"; text: string })
  | (ThreadBase & { kind: "memory"; src?: string; /** Demo memories have no stored photo: they draw this. */ art?: ArtKind; dateLabel: string; note: string });


export type SealedSummary = { conversationId: string; name: string; count: number };
