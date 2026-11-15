import { useState } from "react";
import "./messages.css";
import type { NavProps } from "../home/main-nav";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import { TabFrame } from "../shell/tab-frame";
import { PartyAvatar } from "./avatar";
import { DevSealedPanel } from "./dev-sealed-panel";
import type { ChatRow, SealedSummary } from "./types";

type MessagesScreenProps = {
  pinnedCircles: readonly ChatRow[];
  pinnedPeople: readonly ChatRow[];
  list: readonly ChatRow[];
  onOpen: (conversationId: string) => void;
  /** Dev only: conversations holding sealed memories. Shown only with `onSimulateReply`. */
  sealed?: readonly SealedSummary[];
  onSimulateReply?: (conversationId: string) => void;
  nav: NavProps;
};

const label = (r: ChatRow) => `${r.party.name}, ${r.hasNew ? "new messages" : "nothing new"}`;
const GLOW = { filter: "brightness(1.1) saturate(1.2)", animation: "ms-halo 2.4s ease-in-out infinite" };
const CALM = { filter: "brightness(1.05) saturate(1.1)", boxShadow: `0 ${s(6)} ${s(8)} rgba(74,44,20,.25)` };

/** Messages (docs/specs/messages.md, MSG-1/2/6): pinned closest circles and people, then the other chats. */
export function MessagesScreen({ pinnedCircles, pinnedPeople, list, onOpen, sealed = [], onSimulateReply, nav }: MessagesScreenProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const match = (r: ChatRow) => r.party.name.toLowerCase().includes(q);

  return (
    <TabFrame nav={nav}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${s(44)} ${s(14)} 0 ${s(20)}` }}>
        <h1 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(28), letterSpacing: s(-0.5) }}>Messages</h1>
        {/* TODO(re-evaluate when composing a new chat is designed): does nothing yet. */}
        <button
          type="button"
          aria-label="New message"
          style={{ width: s(44), height: s(44), borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: PAPER, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}
        >
          <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6" />
            <path d="M18 3l3 3-9 9-4 1 1-4z" />
          </svg>
        </button>
      </div>

      <label style={{ margin: `${s(10)} ${s(14)} 0`, height: s(40), boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(20), background: PAPER, border: `${s(2)} solid ${NAVY}`, display: "flex", alignItems: "center", gap: s(8) }}>
        <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          type="search"
          aria-label="Search messages"
          placeholder="search friends and circles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(14), color: NAVY }}
        />
      </label>

      {onSimulateReply && sealed.length > 0 && <DevSealedPanel sealed={sealed} onSimulateReply={onSimulateReply} />}

      <OrnamentRow name="closest circles" rows={pinnedCircles.filter(match)} onOpen={onOpen} />
      <OrnamentRow name="closest people" rows={pinnedPeople.filter(match)} onOpen={onOpen} />

      <div style={{ padding: `${s(18)} ${s(14)} ${s(24)}` }}>
        <div aria-hidden="true" style={{ height: s(5), display: "flex", borderRadius: s(3), overflow: "hidden" }}>
          <span style={{ flex: 1, background: "#C8432B" }} />
          <span style={{ flex: 1, background: "#F0B429" }} />
          <span style={{ flex: 1, background: "#4F8A3C" }} />
        </div>
        <div role="list" aria-label="Chats">
          {list.filter(match).map((r) => (
            <div role="listitem" key={r.conversationId}>
              <button
                type="button"
                aria-label={label(r)}
                onClick={() => onOpen(r.conversationId)}
                style={{ display: "flex", alignItems: "center", gap: s(14), width: "100%", padding: `${s(8)} ${s(6)} ${s(8)} ${s(8)}`, border: 0, borderBottom: `${s(1.5)} solid #E2D3A8`, background: "none", color: NAVY, textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ flex: "none", display: "block", borderRadius: "50%", ...(r.hasNew ? { filter: GLOW.filter, boxShadow: `0 0 0 ${s(8)} #FF7A1A, 0 0 ${s(11)} ${s(10)} rgba(255,122,26,.5)` } : {}) }}>
                  <PartyAvatar party={r.party} size={50} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: s(2) }}>
                  <span style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(16) }}>{r.party.name}</span>
                  <span style={{ fontSize: s(13.5), fontWeight: r.hasNew ? 800 : 500, color: r.hasNew ? NAVY : "#3F4664", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.preview}
                  </span>
                </span>
                <span style={{ flex: "none", fontSize: s(11.5), fontWeight: 700, color: r.hasNew ? "#A8331F" : "#3F4664" }}>{r.time}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </TabFrame>
  );
}

/** A garland of ornaments: the closest circles or the closest people, each hanging from a gold cap. */
function OrnamentRow({ name, rows, onOpen }: { name: string; rows: readonly ChatRow[]; onOpen: (id: string) => void }) {
  if (!rows.length) return null;
  const size = rows.length > 3 ? 64 : 76;
  return (
    <div role="group" aria-label={name} style={{ position: "relative", marginTop: s(24), padding: `0 ${s(6)}`, display: "flex", justifyContent: "space-around" }}>
      <svg viewBox="0 0 390 30" aria-hidden="true" style={{ position: "absolute", left: 0, top: s(-6), width: s(390), height: s(30), overflow: "visible" }}>
        <path d="M75 6C110 24 160 24 195 6C230 24 280 24 315 6" fill="none" stroke="#A8761A" strokeWidth="1.4" strokeDasharray="1 4" strokeLinecap="round" />
      </svg>
      {rows.map((r) => (
        <button
          key={r.conversationId}
          type="button"
          aria-label={label(r)}
          onClick={() => onOpen(r.conversationId)}
          style={{ position: "relative", width: s(size + 22), padding: 0, border: 0, background: "none", color: NAVY, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
        >
          <svg width={s(22)} height={s(19)} viewBox="0 0 30 26" aria-hidden="true" style={{ display: "block", marginBottom: s(-4), position: "relative", zIndex: 1 }}>
            <circle cx="15" cy="7" r="5" fill="none" stroke="#A8761A" strokeWidth="2.2" />
            <rect x="6" y="11" width="18" height="12" rx="3" fill="#F7CB4D" stroke="#A8761A" strokeWidth="1.8" />
            <path d="M10 12.5v9M15 12.5v9M20 12.5v9" stroke="#C99520" strokeWidth="1.4" />
          </svg>
          <span style={{ position: "relative", display: "block" }}>
            <span className={r.hasNew ? "ms-anim" : undefined} data-glow={r.hasNew ? "" : undefined} style={{ display: "block", borderRadius: "50%", ...(r.hasNew ? GLOW : CALM) }}>
              <PartyAvatar party={r.party} size={size} />
            </span>
            <span aria-hidden="true" style={{ position: "absolute", left: s(size * 0.17), top: s(size * 0.12), width: s(size * 0.25), height: s(size * 0.13), borderRadius: "50%", background: "rgba(255,255,255,.6)", transform: "rotate(-32deg)" }} />
          </span>
          <span style={{ marginTop: s(10), fontFamily: FRAUNCES, fontSize: s(13.5), fontWeight: r.hasNew ? 800 : 600, textAlign: "center" }}>{r.party.name}</span>
        </button>
      ))}
    </div>
  );
}
