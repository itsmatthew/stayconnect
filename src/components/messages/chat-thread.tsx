import { useState, type CSSProperties } from "react";
import { MemoryArt } from "../home/memory-art";
import type { Party } from "../home/types";
import { CAVEAT, FRAUNCES, KARLA, NAVY, PAPER, s } from "../home/units";
import { FILM } from "../daily5/polaroid";
import type { HeaderSlotName } from "../profile/types";
import { HeaderPicture, PickArea, type HeaderPane } from "../shared/header-photo";
import { PartyAvatar } from "./avatar";
import type { ThreadMessage } from "./types";

/** A header half; `empty` marks a group half nobody has set yet (GP-12), drawn as the group's art. */
export type ThreadPane = HeaderPane & { empty?: boolean };

type ChatThreadProps = {
  party: Party;
  /** Left and right halves: a group's first photo together and last time together (GP-12), a friend's now and then. */
  panes: readonly [ThreadPane, ThreadPane];
  messages: readonly ThreadMessage[];
  delivered: boolean;
  onBack: () => void;
  onSendText: (text: string) => void;
  /** Groups only: the header logo and name open the group's profile (docs/specs/group-profile.md, GP-1). */
  onOpenProfile?: () => void;
  /** Groups only: an empty header half picks its photo here (GP-12). */
  onPickHeader?: (slot: HeaderSlotName, file: File) => void;
};

const roundButton: CSSProperties = {
  width: s(44),
  height: s(44),
  borderRadius: "50%",
  border: `${s(2)} solid ${NAVY}`,
  boxSizing: "border-box",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: NAVY,
  cursor: "pointer",
};
const theirBubble: CSSProperties = { padding: `${s(9)} ${s(13)}`, borderRadius: `${s(18)} ${s(18)} ${s(18)} ${s(5)}`, background: PAPER, border: `${s(1.5)} solid #DCCB9A`, fontSize: s(15), lineHeight: 1.25 };
const myBubble: CSSProperties = { padding: `${s(9)} ${s(13)}`, borderRadius: `${s(18)} ${s(18)} ${s(5)} ${s(18)}`, background: "#C8432B", color: "#FFF6DA", fontSize: s(15), lineHeight: 1.25 };

/** One chat (docs/specs/messages.md, MSG-3): the two-photo header, bubbles, composer. */
export function ChatThread({ party, panes, messages, delivered, onBack, onSendText, onOpenProfile, onPickHeader }: ChatThreadProps) {
  const [draft, setDraft] = useState("");
  const group = party.kind === "group";

  return (
    <div
      className="absolute inset-0 flex flex-col [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]"
      style={{ background: "linear-gradient(#F6ECCD, #F1E2B8)", fontFamily: KARLA, color: NAVY } as CSSProperties}
    >
      <div className="flex min-h-0 flex-1 flex-col" style={{ width: s(390), margin: "0 auto" }}>
        <header aria-label={`${party.name} header`} style={{ position: "relative", flex: "none", height: s(232) }}>
          <div style={{ display: "flex", gap: s(2), height: s(172), background: NAVY }}>
            <ThreadHalf pane={panes[0]} slot="first" name={party.name} onOpenProfile={onOpenProfile} onPickHeader={onPickHeader} />
            <ThreadHalf pane={panes[1]} slot="last" name={party.name} onOpenProfile={onOpenProfile} onPickHeader={onPickHeader} />
          </div>
          <div aria-hidden="true" style={{ height: s(7), display: "flex", borderTop: `${s(2)} solid ${NAVY}`, borderBottom: `${s(2)} solid ${NAVY}` }}>
            <span style={{ flex: 1, background: "#C8432B" }} />
            <span style={{ flex: 1, background: "#F0B429" }} />
            <span style={{ flex: 1, background: "#4F8A3C" }} />
          </div>
          <button type="button" aria-label="Back to messages" onClick={onBack} style={{ ...roundButton, position: "absolute", left: s(8), top: s(40), background: "rgba(247,239,214,.94)" }}>
            <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={{ position: "absolute", left: "50%", top: s(140), translate: "-50% 0", width: s(72), height: s(72), borderRadius: "50%", background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 ${s(4)} ${s(10)} rgba(27,31,52,.4)` }}>
            {onOpenProfile ? (
              <button
                type="button"
                aria-label={`Open ${party.name} profile`}
                onClick={onOpenProfile}
                style={{ padding: 0, border: 0, borderRadius: "50%", background: "none", cursor: "pointer" }}
              >
                <PartyAvatar party={party} size={58} />
              </button>
            ) : (
              <PartyAvatar party={party} size={58} />
            )}
          </div>
          <h1 style={{ position: "absolute", left: 0, right: 0, top: s(214), margin: 0, textAlign: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) }}>{party.name}</h1>
          {/* The name is a tap target too, laid over the heading so the heading stays just the name. */}
          {onOpenProfile && (
            <button
              type="button"
              aria-label={`Open ${party.name} profile`}
              onClick={onOpenProfile}
              style={{ position: "absolute", left: "50%", top: s(208), translate: "-50% 0", width: s(220), height: s(30), padding: 0, border: 0, background: "none", cursor: "pointer" }}
            />
          )}
        </header>

        <div role="log" aria-label="Conversation" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `${s(14)} ${s(14)} ${s(12)}`, display: "flex", flexDirection: "column", gap: s(5) }}>
          {messages.map((m) => (
            <div key={m.id} data-message="" data-mine={String(m.mine)} style={m.mine ? { alignSelf: "flex-end", maxWidth: s(260) } : { display: "flex", alignItems: "flex-end", gap: s(8), maxWidth: s(290) }}>
              {!m.mine && group && <SenderAvatar sender={m.sender} />}
              <div style={{ display: "flex", flexDirection: "column", gap: s(2), alignItems: m.mine ? "flex-end" : "flex-start" }}>
                {!m.mine && group && m.sender && (
                  <span style={{ fontSize: s(11), fontWeight: 800, color: m.sender.look.ring, paddingLeft: s(4) }}>{m.sender.name}</span>
                )}
                {m.kind === "text" ? <div style={m.mine ? myBubble : theirBubble}>{m.text}</div> : <MemoryBubble m={m} />}
              </div>
            </div>
          ))}
          {delivered && <div style={{ alignSelf: "flex-end", fontSize: s(11), fontWeight: 700, color: "#3F4664", paddingRight: s(4) }}>Delivered</div>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onSendText(draft);
            setDraft("");
          }}
          style={{ flex: "none", boxSizing: "border-box", padding: `${s(10)} ${s(12)} ${s(30)}`, background: PAPER, borderTop: `${s(2)} solid #E2D3A8`, display: "flex", alignItems: "center", gap: s(8) }}
        >
          {/* TODO(re-evaluate when sending photos in chat is designed): does nothing yet. */}
          <button type="button" aria-label="Add a photo" style={{ ...roundButton, flex: "none", background: "#FFF8EC" }}>
            <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>
          <input
            type="text"
            aria-label={`Message ${party.name}`}
            placeholder={`message ${party.name}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ flex: 1, minWidth: 0, height: s(44), boxSizing: "border-box", padding: `0 ${s(16)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", outline: 0, font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), color: NAVY }}
          />
          <button type="submit" aria-label="Send" style={{ ...roundButton, flex: "none", background: "#C8432B", color: "#FFF6DA" }}>
            <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

const HALF_NAMES: Record<HeaderSlotName, string> = { first: "first photo together", last: "last time together" };

/**
 * A group half (GP-1, GP-12): empty, a photo picker with a small "+ ‹name›" over the art; set, a way into the profile, like the logo and name.
 * Friend halves, and groups without a profile, are pictures only.
 */
function ThreadHalf({ pane, slot, name, onOpenProfile, onPickHeader }: { pane: ThreadPane; slot: HeaderSlotName; name: string; onOpenProfile?: () => void; onPickHeader?: (slot: HeaderSlotName, file: File) => void }) {
  if (pane.empty && onPickHeader) {
    return (
      <PickArea label={`Add ${HALF_NAMES[slot]}`} onPick={(f) => onPickHeader(slot, f)} style={{ flex: 1, minWidth: 0 }}>
        <HeaderPicture pane={pane} />
        {/* Below the back button, above the logo. */}
        <span
          aria-hidden="true"
          style={{ position: "absolute", left: "50%", top: s(96), translate: "-50% 0", whiteSpace: "nowrap", padding: `${s(4)} ${s(10)}`, borderRadius: s(14), background: "rgba(27,31,52,.72)", color: "#FFF6DA", fontWeight: 800, fontSize: s(12) }}
        >
          + {HALF_NAMES[slot]}
        </span>
      </PickArea>
    );
  }
  if (!pane.empty && onOpenProfile) {
    return (
      <button type="button" aria-label={`Open ${name} profile`} onClick={onOpenProfile} style={{ flex: 1, minWidth: 0, display: "flex", padding: 0, border: 0, background: "none", cursor: "pointer" }}>
        <HeaderPicture pane={pane} />
      </button>
    );
  }
  return <HeaderPicture pane={pane} />;
}

function SenderAvatar({ sender }: { sender?: ThreadMessage["sender"] }) {
  if (!sender) return <span style={{ flex: "none", width: s(30) }} />;
  const { skin, hair, shirt, bg } = sender.look;
  return (
    <span
      aria-hidden="true"
      style={{
        flex: "none",
        width: s(30),
        height: s(30),
        borderRadius: "50%",
        background: `radial-gradient(circle at 50% 44%, ${skin} 0 25%, transparent 27%), radial-gradient(circle at 50% 36%, ${hair} 0 34%, transparent 36%), radial-gradient(ellipse at 50% 108%, ${shirt} 0 42%, transparent 44%), ${bg}`,
        boxShadow: `0 0 0 ${s(1.5)} ${NAVY}`,
      }}
    />
  );
}

/** A sent Daily 5 memory: a small polaroid with its date, then the note. */
function MemoryBubble({ m }: { m: Extract<ThreadMessage, { kind: "memory" }> }) {
  return (
    <figure aria-label={`Memory from ${m.dateLabel}`} style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: m.mine ? "flex-end" : "flex-start", gap: s(4) }}>
      <div style={{ width: s(150), boxSizing: "border-box", padding: `${s(7)} ${s(7)} 0`, background: "#FDFBF5", border: `${s(2)} solid ${NAVY}`, borderRadius: s(4), boxShadow: `0 ${s(4)} ${s(8)} rgba(74,44,20,.3)`, transform: "rotate(-1.5deg)" }}>
        {m.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: URL
          <img src={m.src} alt="" style={{ display: "block", width: "100%", height: s(132), objectFit: "cover", filter: FILM }} />
        ) : m.art ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block", width: "100%", height: s(132), filter: FILM }}>
            <MemoryArt kind={m.art} cx={50} cy={50} R={50} />
          </svg>
        ) : (
          <div aria-hidden="true" style={{ height: s(132), background: "#1A1714" }} />
        )}
        <div style={{ height: s(30), display: "flex", alignItems: "center", paddingLeft: s(2), fontFamily: CAVEAT, fontWeight: 700, fontSize: s(17) }}>{m.dateLabel}</div>
      </div>
      {m.note && <figcaption style={m.mine ? myBubble : theirBubble}>{m.note}</figcaption>}
    </figure>
  );
}
