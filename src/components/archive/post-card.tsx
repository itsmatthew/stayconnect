import type { CSSProperties } from "react";
import { FRAUNCES, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { ArchivePhoto } from "./archive-photo";
import type { PostCardView, SlotKind } from "./types";

const PAPER_GAP = "#F6ECCD";
const GOLD = "#F7CB4D";

/** Stacked thin rings outside the card's border, one per shared circle, with a sliver of paper between (ARC-7). */
export function circleLines(colors: readonly string[]): string {
  return colors
    .flatMap((c, i) => [`0 0 0 ${s(1 + 3 * i)} ${PAPER_GAP}`, `0 0 0 ${s(2.5 + 3 * i)} ${c}`])
    .join(", ");
}

/** Navy text on light canopies (amber), cream on the rest, as in the reference. */
function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? NAVY : "#FFF6DA";
}

// Frames sit outside the circle lines (up to 8.5 design px out), so their padding must exceed that.
const PHOTO_HEIGHT: Record<SlotKind, number> = { week: 280, bonus: 290, month: 340, year: 400 };

/** A friend's post, from the reference's feed card. Monthly, yearly and bonus-week cards are bigger and framed (ARC-8). */
export function PostCard({ card }: { card: PostCardView }) {
  const { variant, palette } = card;
  const bonus = variant === "bonus";
  const bg = bonus ? "#2B3350" : palette.canopy;
  const ink = bonus ? "#FFF6DA" : inkOn(palette.canopy);
  const frame: CSSProperties =
    variant === "month"
      ? { padding: s(13), borderRadius: s(30), background: GOLD, animation: "ar-glow 3.2s ease-in-out infinite" }
      : variant === "year"
        ? { padding: s(15), borderRadius: s(32), background: `repeating-linear-gradient(45deg, ${GOLD} 0 ${s(8)}, #E3A22F ${s(8)} ${s(16)})`, boxShadow: `0 0 0 ${s(2)} ${NAVY}, 0 ${s(8)} ${s(18)} rgba(74,44,20,.35)` }
        : {};

  return (
    <div className={variant === "month" ? "ar-anim" : undefined} style={{ position: "relative", ...frame }}>
      <article
        aria-label={card.label}
        data-variant={variant}
        data-outlines={card.outlines.join(" ")}
        style={{
          borderRadius: s(18),
          background: bonus ? `radial-gradient(circle at 80% 10%, #4A5A8C, ${bg} 60%)` : bg,
          border: `${s(2)} solid ${NAVY}`,
          overflow: "hidden",
          boxShadow: circleLines(card.outlines),
        }}
      >
      {card.ribbon && (
        <div
          style={{
            width: "fit-content",
            margin: `${s(10)} auto 0`,
            padding: `${s(4)} ${s(14)}`,
            borderRadius: s(14),
            border: `${s(2)} solid ${NAVY}`,
            background: bonus ? "#9FB6E8" : GOLD,
            color: NAVY,
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: s(variant === "year" ? 15 : 13),
            whiteSpace: "nowrap",
          }}
        >
          {card.ribbon}
        </div>
      )}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: `${s(6)} ${s(9)}`, padding: `${s(8)} ${s(10)}`, color: ink }}>
          <PartyAvatar party={{ kind: "friend", id: card.id, name: card.author.name, closest: false, look: card.author.look }} size={34} />
          <span style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", lineHeight: 1.15, whiteSpace: "nowrap" }}>
            <span style={{ fontWeight: 800, fontSize: s(14.5) }}>{card.author.name}</span>
            <span style={{ fontSize: s(11.5), fontWeight: 700, opacity: 0.9 }}>{card.time}</span>
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: s(4), flexWrap: "wrap", justifyContent: "flex-end" }}>
            {card.tags.map((t) => (
              <Tag key={t.name} color={t.color}>
                {t.name}
              </Tag>
            ))}
            {card.moreTags > 0 && <Tag>+{card.moreTags}</Tag>}
          </span>
        </div>
        <div style={{ margin: `0 ${s(8)} ${s(8)}`, padding: s(8), borderRadius: s(12), background: bonus ? "#3B4870" : palette.rim }}>
          <ArchivePhoto photo={card.photo} style={{ height: s(PHOTO_HEIGHT[variant]), borderRadius: s(7) }} />
          {card.caption && (
            <p data-caption="" style={{ margin: `${s(8)} ${s(2)} 0`, color: bonus ? "#FFF6DA" : NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(variant === "week" ? 14.5 : 16), lineHeight: 1.3 }}>
              {card.caption}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

/** The reference's cream tag pill, with a tiny tree in the circle's colour. */
function Tag({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: s(5),
        height: s(24),
        padding: `0 ${s(9)} 0 ${s(color ? 7 : 9)}`,
        borderRadius: s(12),
        background: "#FFF8EC",
        color: NAVY,
        fontFamily: FRAUNCES,
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: s(12),
        whiteSpace: "nowrap",
      }}
    >
      {color && (
        <svg width={s(12)} height={s(14)} viewBox="0 0 12 14" aria-hidden="true">
          <rect x="5" y="8" width="2" height="6" fill="#8C4A2B" />
          <circle cx="6" cy="5.5" r="5" fill={color} />
        </svg>
      )}
      {children}
    </span>
  );
}
