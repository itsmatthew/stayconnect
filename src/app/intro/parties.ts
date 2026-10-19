// Groups and friends as chat/send parties. A party's id is its conversation id.
import type { RecipientSections } from "@/components/daily5/types";
import type { CircleGroup, Friend, Party } from "@/components/home/types";
import { conversationId } from "./messages/conversations";

export const groupParty = (g: CircleGroup): Party => ({
  kind: "group",
  id: conversationId("group", g.id),
  name: g.name,
  closest: g.closest,
  palette: g.palette,
});

export const friendParty = (f: Friend): Party => ({
  kind: "friend",
  id: conversationId("friend", f.id),
  name: f.name,
  closest: f.closest,
  look: f.look,
});

/** The send picker: closest circles, then other groups, then people (docs/specs/daily5.md, D5-11). */
export function recipientSections(groups: readonly CircleGroup[], friends: readonly Friend[]): RecipientSections {
  return {
    closest: groups.filter((g) => g.closest).map(groupParty),
    others: groups.filter((g) => !g.closest).map(groupParty),
    people: friends.map(friendParty),
  };
}
