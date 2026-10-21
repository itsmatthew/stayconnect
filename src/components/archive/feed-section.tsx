import { FRAUNCES, NAVY, s } from "../home/units";
import { PostCard } from "./post-card";
import type { FeedSectionView } from "./types";

/** One period of the feed: friends' cards you've unlocked, then the locked line over blurred stand-ins (ARC-8, ARC-9). */
export function FeedSection({ section }: { section: FeedSectionView }) {
  return (
    <section aria-label={section.title} style={{ padding: `${s(22)} ${s(14)} 0` }}>
      <h2 style={{ margin: `0 0 ${s(14)}`, display: "flex", alignItems: "baseline", gap: s(8), fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(19), letterSpacing: s(-0.3) }}>
        {section.title}
        <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(13), color: "#8A6A3A" }}>{section.range}</span>
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: s(16) }}>
        {section.cards.map((c) => (
          <PostCard key={c.id} card={c} />
        ))}
      </div>
      {section.locked && <Locked text={section.locked} standins={section.standins} />}
    </section>
  );
}

/** Stand-ins are drawn shapes in circle colours, blurred: they never hold the photo, the name or the date. */
function Locked({ text, standins }: { text: string; standins: readonly string[] }) {
  return (
    <div style={{ position: "relative", marginTop: s(standins.length ? 4 : 0), minHeight: s(standins.length ? 180 : 0) }}>
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: s(10), filter: `blur(${s(7)})`, opacity: 0.85 }}>
        {standins.slice(0, 3).map((color, i) => (
          <div key={i} data-standin="" style={{ height: s(i === 0 ? 150 : 70), borderRadius: s(18), border: `${s(2)} solid ${NAVY}`, background: `linear-gradient(160deg, ${color}, #F1E2B8 140%)` }} />
        ))}
        {/* More hidden posts than we draw: keep one stand-in per post, just shorter. */}
        {standins.slice(3).map((color, i) => (
          <div key={i + 3} data-standin="" style={{ height: s(14), borderRadius: s(8), background: color }} />
        ))}
      </div>
      <p
        style={{
          position: standins.length ? "absolute" : "static",
          inset: 0,
          margin: standins.length ? "auto" : "0 auto",
          height: "fit-content",
          maxWidth: s(300),
          padding: `${s(12)} ${s(16)}`,
          borderRadius: s(16),
          border: `${s(2)} solid ${NAVY}`,
          background: "#FFF8EC",
          boxShadow: `0 ${s(3)} 0 ${NAVY}`,
          textAlign: "center",
          fontFamily: FRAUNCES,
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: s(15),
          lineHeight: 1.3,
        }}
      >
        <span aria-hidden="true" style={{ marginRight: s(6), fontStyle: "normal" }}>
          🔒
        </span>
        {text}
      </p>
    </div>
  );
}
