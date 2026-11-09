import { useId } from "react";
import type { FriendLook } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import "./mail.css";
import { MailboxIcon } from "./mailbox-icon";

/** One row to pick: a person (with what helps tell them apart), or a phone number. Nothing else from anyone's profile. */
export type DropRow =
  | { kind: "person"; key: string; name: string; look: FriendLook; /** "@katemorgan · 2 mutual · Leo, Ana", or "in your branches". */ detail: string }
  | { kind: "phone"; key: string; /** "(555) 012-3456" */ number: string };

type DropSheetProps = {
  photo: { src?: string; alt: string };
  query: string;
  onQuery: (q: string) => void;
  rows: readonly DropRow[];
  /** "Nobody by that name on Now & Then." while a search finds nothing. */
  empty?: string;
  picked?: string;
  onPick: (key: string) => void;
  /** "Pick someone", "Drop in Kate Morgan’s mailbox", "Drop it in their mailbox". */
  buttonLabel: string;
  canDrop: boolean;
  /** Why it can't go yet: a limit (MAIL-6). */
  note?: string;
  onDrop: () => void;
  onCancel: () => void;
};

/** "Drop it in a mailbox" (docs/specs/mail.md, MAIL-2/3), from Daily5Send.dc.html, with one box for a name, @username or phone. */
export function DropSheet({ photo, query, onQuery, rows, empty, picked, onPick, buttonLabel, canDrop, note, onDrop, onCancel }: DropSheetProps) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-40 [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]" style={{ fontFamily: KARLA, color: NAVY }}>
      <div className="ml-fade" aria-hidden="true" onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(27,31,52,.55)" }} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="ml-up" style={{ position: "absolute", left: "50%", bottom: 0, translate: "-50% 0", width: s(390), maxHeight: "88dvh", overflowY: "auto", boxSizing: "border-box", padding: `${s(10)} ${s(18)} ${s(30)}`, borderRadius: `${s(24)} ${s(24)} 0 0`, background: "#F7EFD6", borderTop: `${s(2)} solid ${NAVY}`, display: "flex", flexDirection: "column", gap: s(12) }}>
        <div aria-hidden="true" style={{ alignSelf: "center", width: s(44), height: s(5), borderRadius: s(3), background: "#C9B98C" }} />
        <div style={{ display: "flex", alignItems: "center", gap: s(12) }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser */}
          {photo.src ? <img src={photo.src} alt={photo.alt} style={{ display: "block", flex: "none", width: s(52), height: s(62), boxSizing: "border-box", border: `${s(3)} solid #FFFFFF`, borderRadius: s(3), objectFit: "cover", transform: "rotate(-4deg)", boxShadow: `0 ${s(4)} ${s(6)} rgba(74,44,20,.35)` }} /> : <span style={{ width: s(52), height: s(62), flex: "none" }} />}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: s(2) }}>
            <h2 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20), letterSpacing: s(-0.3) }}>
              Drop it in a mailbox
            </h2>
            <p style={{ margin: 0, fontSize: s(12.5), fontWeight: 700, color: "#3F4664", lineHeight: 1.3 }}>Anyone on Now &amp; Then. They don&apos;t have to be in your circles.</p>
          </div>
          <button type="button" aria-label="Cancel" onClick={onCancel} style={{ flex: "none", width: 44, height: 44, borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}>
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <label style={{ height: s(46), minHeight: 44, boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(23), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", display: "flex", alignItems: "center", gap: s(9) }}>
          <svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input type="search" aria-label="Find someone" placeholder="name, @username or phone" value={query} onChange={(e) => onQuery(e.target.value)} style={{ flex: 1, minWidth: 0, border: 0, background: "none", outline: 0, font: "inherit", fontSize: s(15.5), fontWeight: 700, color: NAVY }} />
        </label>
        {empty && <p style={{ margin: 0, textAlign: "center", fontSize: s(13), fontWeight: 700, color: "#6A604C" }}>{empty}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: s(6) }}>
          {rows.map((r) => {
            const on = r.key === picked;
            return (
              <button key={r.key} type="button" aria-pressed={on} onClick={() => onPick(r.key)} style={{ height: s(62), minHeight: 44, boxSizing: "border-box", padding: `0 ${s(12)}`, borderRadius: s(16), border: `${s(2)} solid ${on ? NAVY : "transparent"}`, background: on ? "#FFF6DA" : "none", color: NAVY, display: "flex", alignItems: "center", gap: s(12), textAlign: "left", cursor: "pointer" }}>
                <span aria-hidden="true" style={{ flex: "none", width: s(42), height: s(42), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#CFE4F2" }}>
                  {r.kind === "person" ? (
                    <PartyAvatar party={{ kind: "friend", id: r.key, name: r.name, closest: false, look: r.look }} size={40} />
                  ) : (
                    <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                    </svg>
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: s(1) }}>
                  <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(16), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.kind === "person" ? r.name : `Drop for ${r.number}`}</span>
                  <span style={{ fontSize: s(12.5), fontWeight: 700, color: "#6A604C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.kind === "person" ? r.detail : "their mailbox, or an invite if they're new"}</span>
                </span>
                {on && (
                  <span aria-hidden="true" style={{ flex: "none", width: s(26), height: s(26), borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={s(13)} height={s(13)} viewBox="0 0 24 24" fill="none" stroke="#FFF6DA" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {note && <p style={{ margin: 0, textAlign: "center", fontSize: s(13), fontWeight: 800, color: "#A8331F" }}>{note}</p>}
        <button type="button" disabled={!canDrop} onClick={onDrop} style={{ height: s(52), minHeight: 44, marginTop: s(4), borderRadius: s(26), border: `${s(2)} solid ${NAVY}`, background: canDrop ? NAVY : "#E2D3A8", color: canDrop ? "#FFF6DA" : "#6B6A66", boxShadow: canDrop ? `0 ${s(3)} 0 #11152A` : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: s(9), fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(17), cursor: canDrop ? "pointer" : "default" }}>
          <MailboxIcon size={s(30)} />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
