import { useState } from "react";
import type { NavProps } from "../home/main-nav";
import { FRAUNCES, NAVY, s } from "../home/units";
import { TabFrame } from "../shell/tab-frame";
import { GiftShelf, type ShelfGift } from "./gift-shelf";
import { SixtyFiveGrid } from "./sixty-five-grid";
import { TileViewer } from "./tile-viewer";
import type { MeTile } from "./types";
import { YearSelect } from "./year-select";

type MeScreenProps = {
  year: number;
  years: readonly number[];
  onYearChange: (y: number) => void;
  tiles: readonly MeTile[];
  nav: NavProps;
  /** Opens the gift maker (docs/specs/gifts.md, GIFT-1). */
  onSendGift?: () => void;
  /** "Let people find me by name" (docs/specs/mail.md, MAIL-7). */
  findMe?: { on: boolean; onChange: (on: boolean) => void };
  /** Which view to open on: the shelf, when you come from "your gifts" or a kept gift (GIFT-21). */
  initialView?: "posts" | "gifts";
  /** Gifts on your shelf, newest first, opening one big, and one just landing (GIFT-21, GIFT-23). */
  shelf?: { gifts: readonly ShelfGift[]; onOpenGift: (id: string) => void; landing?: string };
  /** "Who can drop in my mailbox" (docs/specs/mail.md, MAIL-10). */
  mailbox?: { options: readonly { id: string; label: string }[]; value: string; onChange: (id: string) => void };
};

/** The pill's look, 32 tall as designed; the button around it is 44 to tap. */
const pill = { width: "100%", height: s(32), boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: s(5), borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(14) } as const;
const pillButton = { flex: 1, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" } as const;

/** Me (docs/specs/me.md): the posts / year / gifts row, then your 65 for that year. Profile and bio come later (TODO). */
export function MeScreen({ year, years, onYearChange, tiles, nav, onSendGift, findMe, mailbox, initialView = "posts", shelf }: MeScreenProps) {
  const [view, setView] = useState<"posts" | "gifts">(initialView);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = tiles.find((t) => t.key === openKey);
  return (
    <TabFrame nav={nav}>
      <h1 style={{ margin: 0, padding: `${s(44)} ${s(20)} 0`, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(28), letterSpacing: s(-0.5) }}>Me</h1>
      <div style={{ display: "flex", gap: s(8), padding: `${s(16)} ${s(14)} ${s(12)}` }}>
        <button type="button" aria-current={view === "posts" ? "page" : undefined} onClick={() => setView("posts")} style={pillButton}>
          <span style={{ ...pill, background: "#B43A2A", color: "#FFF6DA", opacity: view === "posts" ? 1 : 0.92, boxShadow: view === "posts" ? `0 ${s(3)} 0 ${NAVY}` : "none" }}>posts</span>
        </button>
        <YearSelect year={year} years={years} onChange={onYearChange} />
        <button type="button" aria-current={view === "gifts" ? "page" : undefined} onClick={() => setView("gifts")} style={pillButton}>
          <span style={{ ...pill, background: "#4F7A36", color: "#FFF6DA", boxShadow: view === "gifts" ? `0 ${s(3)} 0 ${NAVY}` : "none" }}>gifts</span>
        </button>
      </div>
      {view === "posts" ? <SixtyFiveGrid year={year} tiles={tiles} onOpen={setOpenKey} /> : <GiftShelf onSendGift={onSendGift} gifts={shelf?.gifts} onOpenGift={shelf?.onOpenGift} landing={shelf?.landing} />}
      {findMe && <FindMeRow {...findMe} />}
      {mailbox && <MailboxRow {...mailbox} />}
      {open?.photo && <TileViewer tile={{ ...open, photo: open.photo }} onClose={() => setOpenKey(null)} />}
    </TabFrame>
  );
}

/** "Let people find me by name", on by default (docs/specs/mail.md, MAIL-7). */
function FindMeRow({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div style={{ margin: `${s(18)} ${s(14)} ${s(24)}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(12) }}>
      <div style={{ display: "flex", flexDirection: "column", gap: s(2) }}>
        <span style={{ fontSize: s(14), fontWeight: 800 }}>Let people find me by name</span>
        <span style={{ fontSize: s(12), fontWeight: 500, color: "#5C5442" }}>They can still find you by your exact @username or phone number.</span>
      </div>
      <button type="button" role="switch" aria-label="Let people find me by name" aria-checked={on} onClick={() => onChange(!on)} style={{ flex: "none", width: s(52), minWidth: 44, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <span style={{ position: "relative", display: "block", width: s(48), height: s(28), boxSizing: "border-box", borderRadius: s(14), border: `${s(2)} solid ${NAVY}`, background: on ? "#4F7A36" : "#D9CBA4" }}>
          <span style={{ position: "absolute", left: s(on ? 22 : 2), top: s(2), width: s(20), height: s(20), boxSizing: "border-box", borderRadius: "50%", background: "#FFF6DA", border: `${s(2)} solid ${NAVY}`, transition: "left .2s ease" }} />
        </span>
      </button>
    </div>
  );
}

/** "Who can drop in my mailbox": three choices, anyone by default (docs/specs/mail.md, MAIL-10). Each looks 32 tall and is 44 to tap. */
function MailboxRow({ options, value, onChange }: NonNullable<MeScreenProps["mailbox"]>) {
  return (
    <div style={{ margin: `0 ${s(14)} ${s(24)}`, display: "flex", flexDirection: "column", gap: s(6) }}>
      <span id="mailbox-from-label" style={{ fontSize: s(14), fontWeight: 800 }}>Who can drop in my mailbox</span>
      <span style={{ fontSize: s(12), fontWeight: 500, color: "#5C5442" }}>Your circles always can.</span>
      <div role="radiogroup" aria-labelledby="mailbox-from-label" style={{ display: "flex", gap: s(6) }}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.id)} style={{ flex: 1, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
              <span style={{ width: "100%", minHeight: s(32), boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", padding: `0 ${s(6)}`, borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, background: on ? NAVY : "#FFF6DA", color: on ? "#FFF6DA" : NAVY, fontSize: s(12), fontWeight: 800, textAlign: "center", lineHeight: 1.15 }}>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
