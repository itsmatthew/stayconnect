import { useState } from "react";
import type { NavProps } from "../home/main-nav";
import { FRAUNCES, NAVY, s } from "../home/units";
import { TabFrame } from "../shell/tab-frame";
import { GiftShelf } from "./gift-shelf";
import { SixtyFiveGrid } from "./sixty-five-grid";
import { TileViewer } from "./tile-viewer";
import type { MeTile } from "./types";
import { YearSelect } from "./year-select";

type MeScreenProps = { year: number; years: readonly number[]; onYearChange: (y: number) => void; tiles: readonly MeTile[]; nav: NavProps; /** Opens the gift maker (docs/specs/gifts.md, GIFT-1). */ onSendGift?: () => void };

/** The pill's look, 32 tall as designed; the button around it is 44 to tap. */
const pill = { width: "100%", height: s(32), boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: s(5), borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(14) } as const;
const pillButton = { flex: 1, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" } as const;

/** Me (docs/specs/me.md): the posts / year / gifts row, then your 65 for that year. Profile and bio come later (TODO). */
export function MeScreen({ year, years, onYearChange, tiles, nav, onSendGift }: MeScreenProps) {
  const [view, setView] = useState<"posts" | "gifts">("posts");
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
      {view === "posts" ? <SixtyFiveGrid year={year} tiles={tiles} onOpen={setOpenKey} /> : <GiftShelf onSendGift={onSendGift} />}
      {open?.photo && <TileViewer tile={{ ...open, photo: open.photo }} onClose={() => setOpenKey(null)} />}
    </TabFrame>
  );
}
