import { useState } from "react";
import "./archive.css";
import { BellIcon } from "../home/icons";
import type { NavProps } from "../home/main-nav";
import { FRAUNCES, INK, NAVY, s } from "../home/units";
import { TabFrame } from "../shell/tab-frame";
import { FeedPost } from "./feed-post";
import { PostPicker } from "./post-picker";
import type { FeedPostView, PickerView, SlotView, WeekCardView } from "./types";
import { WeekCard } from "./week-card";

type ArchiveScreenProps = {
  week: WeekCardView;
  slots: readonly SlotView[];
  posts: readonly FeedPostView[];
  onPost: (slotKey: string) => void;
  /** The send arrow on a post: message its author. */
  onMessage: (postId: string) => void;
  picker: PickerView | null;
  onPick: (file: File) => void;
  onConfirmPost: (caption: string) => void;
  onCancelPost: () => void;
  nav: NavProps;
};

/** Posts shown at first, and added by each "Show earlier" (ARC-8). */
export const FEED_PAGE = 20;

/**
 * The Archive (docs/specs/archive.md), from the designer's Archive feed: a bell, "Archive" and you over a double rule,
 * this week's card, then everyone's posts, newest first. On wide screens the bell and you are in the top bar already.
 */
export function ArchiveScreen({ week, slots, posts, onPost, onMessage, picker, onPick, onConfirmPost, onCancelPost, nav }: ArchiveScreenProps) {
  const [shown, setShown] = useState(FEED_PAGE);
  return (
    <TabFrame nav={nav}>
      <header style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: `${s(30)} ${s(10)} 0` }}>
        <button type="button" aria-label="Notifications, 1 new" className="md:invisible" style={{ justifySelf: "start", position: "relative", width: 44, height: 44, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <BellIcon size={s(20)} />
          <span aria-hidden="true" style={{ position: "absolute", right: s(10), top: s(9), width: s(7), height: s(7), borderRadius: "50%", background: "#E0482B" }} />
        </button>
        <h1 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(26), letterSpacing: s(-0.4) }}>Archive</h1>
        <button type="button" aria-label="Your profile" className="md:invisible" onClick={() => nav.onNavigate?.("Me")} style={{ justifySelf: "end", width: 44, height: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span aria-hidden="true" style={{ width: s(36), height: s(36), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid ${INK}`, background: "#F0BE50", color: INK, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15), display: "flex", alignItems: "center", justifyContent: "center" }}>J</span>
        </button>
      </header>
      {/* The design's double rule under the title. */}
      <div aria-hidden="true" style={{ margin: `${s(6)} ${s(14)} 0`, height: s(5), borderTop: `${s(1.5)} solid ${NAVY}`, borderBottom: `${s(1.5)} solid ${NAVY}` }} />
      <WeekCard week={week} slots={slots} onPost={onPost} />
      <section aria-label="Feed" style={{ marginTop: s(16), paddingBottom: s(28) }}>
        {!posts.length && <p style={{ margin: `${s(24)} ${s(24)}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(16), lineHeight: 1.4, color: "#5C5442", textAlign: "center" }}>Your circles&apos; photos will show here.</p>}
        {posts.slice(0, shown).map((post) => (
          <FeedPost key={post.id} post={post} onMessage={() => onMessage(post.id)} />
        ))}
        {posts.length > shown && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: s(14) }}>
            <button
              type="button"
              onClick={() => setShown((n) => n + FEED_PAGE)}
              style={{ minHeight: 44, height: s(40), padding: `0 ${s(20)}`, borderRadius: s(20), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(15), cursor: "pointer" }}
            >
              Show earlier
            </button>
          </div>
        )}
      </section>
      {picker && <PostPicker picker={picker} onPick={onPick} onPost={onConfirmPost} onCancel={onCancelPost} />}
    </TabFrame>
  );
}
