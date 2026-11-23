import { FRAUNCES, NAVY, s } from "../home/units";
import type { FriendLook } from "../home/types";
import { faceGradient } from "../messages/avatar";
import { ArchivePhoto } from "./archive-photo";
import type { FeedPostView } from "./types";

const PAPER = "#F6ECCD";

/**
 * Them as a kid, the "then" beside their face in the designer's feed. TODO(server): their own "then" photo from their
 * profile; until then, their drawn face on a paler ground.
 */
const thenLook = (look: FriendLook): FriendLook => ({ ...look, bg: "#FBEFC9" });

function Face({ look, ring, small }: { look: FriendLook; ring: string; small?: boolean }) {
  const size = small ? 34 : 38;
  return <span aria-hidden="true" style={{ flex: "none", width: s(size), height: s(size), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid #FFFBF0`, boxShadow: `0 0 0 ${s(2)} ${ring}`, background: faceGradient(look) }} />;
}

/**
 * One post in the feed (docs/specs/archive.md, ARC-7, ARC-8), from the designer's Archive feed: their face, name and
 * circle (a dot in its color), them as a kid, and a send arrow to message them; then the photo, full width. A week's
 * photo has its day and "WEEK 45" over its foot; a month, year or bonus week gets a cream bar in the circle's color.
 * Posts are parted by a band of that color.
 */
export function FeedPost({ post, onMessage }: { post: FeedPostView; onMessage: () => void }) {
  const color = post.circle.color;
  const overlay = post.variant === "week" || post.variant === "bonus";
  return (
    <article aria-label={post.label} data-variant={post.variant} data-color={color} style={{ background: PAPER }}>
      <div style={{ display: "flex", alignItems: "center", gap: s(8), padding: `${s(8)} ${s(6)} ${s(8)} ${s(12)}` }}>
        <Face look={post.author.look} ring={color} />
        <span style={{ display: "flex", flexDirection: "column", gap: s(1), minWidth: 0 }}>
          <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15), lineHeight: 1.1 }}>{post.author.name}</span>
          <span style={{ display: "flex", alignItems: "center", gap: s(4), fontSize: s(10.5), fontWeight: 700, color: "#5C5442" }}>
            <span aria-hidden="true" style={{ width: s(7), height: s(7), borderRadius: "50%", background: color }} />
            {post.circle.name}
          </span>
        </span>
        <Face look={thenLook(post.author.look)} ring={color} small />
        <span style={{ flex: 1 }} />
        <button type="button" aria-label={`Message ${post.author.name}`} onClick={onMessage} style={{ flex: "none", width: 44, minHeight: 44, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" style={{ display: "block" }}>
            <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
          </svg>
        </button>
      </div>
      <div style={{ position: "relative", height: s(440) }}>
        <ArchivePhoto photo={post.photo} />
        {overlay && (
          // The week's day over the photo's foot, on a soft shade (an SVG gradient, as everything that ports is).
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: s(46) }}>
            <svg viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
              <defs>
                <linearGradient id={`shade-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity=".55" />
                </linearGradient>
              </defs>
              <rect width="10" height="10" fill={`url(#shade-${post.id})`} />
            </svg>
            <Footer left={post.footer.left} right={post.footer.right} leftColor="#FFE9A8" rightColor="#F7CB4D" />
          </div>
        )}
      </div>
      {!overlay && (
        <div style={{ position: "relative", height: s(34), background: "#FFFBF0", borderBottom: `${s(2)} solid ${color}` }}>
          <Footer left={post.footer.left} right={post.footer.right} leftColor={color} rightColor={color} big />
        </div>
      )}
      {post.caption && (
        <p data-caption="" style={{ margin: 0, padding: `${s(8)} ${s(14)} 0`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(13.5), lineHeight: 1.3 }}>
          {post.caption}
        </p>
      )}
      {/* The band between posts, in the circle's color fading to paper. */}
      <svg viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", width: "100%", height: s(24), marginTop: s(post.caption ? 8 : 0) }}>
        <defs>
          <linearGradient id={`band-${post.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="10" height="10" fill={`url(#band-${post.id})`} />
      </svg>
    </article>
  );
}

function Footer({ left, right, leftColor, rightColor, big }: { left: string; right: string; leftColor: string; rightColor: string; big?: boolean }) {
  return (
    <div style={{ position: "absolute", left: s(12), right: s(12), bottom: 0, height: s(34), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontFamily: FRAUNCES, fontStyle: big ? "normal" : "italic", fontWeight: 800, fontSize: s(big ? 15 : 13), color: leftColor }}>{left}</span>
      <span style={{ fontSize: s(8.5), fontWeight: 800, letterSpacing: ".14em", color: rightColor }}>{right}</span>
    </div>
  );
}
