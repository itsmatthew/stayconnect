import { CircleToggle, type CirclesView } from "./circle-toggle";
import { FRAUNCES, NAVY, s } from "./units";
import type { NavProps } from "./main-nav";
import { TabFrame } from "../shell/tab-frame";

type HomeEmptyProps = { nav: NavProps; onDaily5: () => void; view: CirclesView; onViewChange: (v: CirclesView) => void };

/** Home with no circles yet (docs/specs/home.md, HOME-12): one young sapling, and a way to send a first memory. The toggle still leads to Your circle. */
export function HomeEmpty({ nav, onDaily5, view, onViewChange }: HomeEmptyProps) {
  return (
    <TabFrame nav={nav}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: `${s(24)} ${s(28)} ${s(32)}`, textAlign: "center" }}>
        <CircleToggle value={view} onChange={onViewChange} />
        <div style={{ height: s(48) }} />
        <Sapling />
        <p style={{ margin: `${s(22)} 0 0`, fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(20), lineHeight: 1.3, letterSpacing: s(-0.2) }}>
          Your circles grow when someone sends you a memory — or send one first
        </p>
        <button
          type="button"
          onClick={onDaily5}
          style={{
            marginTop: s(24),
            height: s(44),
            padding: `0 ${s(22)}`,
            borderRadius: s(22),
            border: `${s(2)} solid ${NAVY}`,
            background: "#4E7A5C",
            color: "#FFF6DA",
            boxShadow: `0 ${s(3)} 0 ${NAVY}`,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: s(16),
            cursor: "pointer",
          }}
        >
          Go to Daily 5
        </button>
      </div>
    </TabFrame>
  );
}

/** A young tree in the home scenery's palette: a thin trunk, two leaves and a small green canopy on a mound. */
function Sapling() {
  return (
    <svg role="img" aria-label="A young sapling" viewBox="0 0 200 180" style={{ width: s(200), height: s(180), display: "block" }}>
      <ellipse cx="100" cy="160" rx="78" ry="16" fill="#C9B27A" opacity=".55" />
      <ellipse cx="100" cy="158" rx="52" ry="10" fill="#8FA86A" />
      <path d="M100 158C99 130 101 108 100 82" fill="none" stroke="#8C4A2B" strokeWidth="5" strokeLinecap="round" />
      <path d="M100 124C88 118 78 108 74 96C88 96 98 106 100 120" fill="#6E9A5A" stroke="#3F5F4C" strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 112C112 104 124 100 134 102C128 114 114 118 101 116" fill="#7FAE68" stroke="#3F5F4C" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="100" cy="66" r="26" fill="#5E8068" stroke="#3F5F4C" strokeWidth="2" />
      <circle cx="91" cy="57" r="9" fill="#B8D2BE" opacity=".7" />
    </svg>
  );
}
