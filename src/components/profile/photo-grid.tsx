import { useEffect, useRef, type CSSProperties } from "react";
import { MemoryArt } from "../home/memory-art";
import { FRAUNCES, KARLA, NAVY, PAPER, s } from "../home/units";
import { FILM } from "../daily5/polaroid";
import type { ProfilePhoto } from "./types";

/** One photo: the stored image, else its demo art, else a dark frame while it loads. */
export function PhotoFill({ photo, style }: { photo: ProfilePhoto; style?: CSSProperties }) {
  const fill: CSSProperties = { display: "block", width: "100%", height: "100%", ...style };
  if (photo.src) {
    // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser
    return <img src={photo.src} alt="" style={{ ...fill, objectFit: "cover", filter: FILM }} />;
  }
  if (photo.art) {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={fill}>
        <MemoryArt kind={photo.art} cx={50} cy={50} R={50} />
      </svg>
    );
  }
  return <span aria-hidden="true" style={{ ...fill, background: "#1A1714" }} />;
}

/** Square tiles three across, edge to edge (GP-5). */
export function PhotoGrid({ photos }: { photos: readonly ProfilePhoto[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: s(2), background: "#F6ECCD" }}>
      {photos.map((p) => (
        <div key={p.id} role="img" aria-label={p.label} style={{ aspectRatio: "1", background: NAVY, overflow: "hidden" }}>
          <PhotoFill photo={p} />
        </div>
      ))}
    </div>
  );
}

type AllPhotosProps = {
  title: string;
  photos: readonly ProfilePhoto[];
  /** More to load once the end scrolls into view. */
  hasMore: boolean;
  onMore: () => void;
  onBack: () => void;
};

/** Every visible memory, full screen, loading more as the end scrolls into view (GP-5). */
export function AllPhotos({ title, photos, hasMore, onMore, onBack }: AllPhotosProps) {
  const end = useRef<HTMLDivElement>(null);
  const more = useRef(onMore);
  useEffect(() => {
    more.current = onMore;
  });
  useEffect(() => {
    const el = end.current;
    if (!hasMore || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) more.current();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, photos.length]);

  return (
    <section
      aria-label={title}
      className="absolute inset-0 overflow-y-auto [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]"
      style={{ zIndex: 10, background: "linear-gradient(#F6ECCD, #F1E2B8)", fontFamily: KARLA, color: NAVY } as CSSProperties}
    >
      <div style={{ width: s(390), margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: s(12), padding: `${s(14)} ${s(12)}` }}>
          <button
            type="button"
            aria-label="Back to the profile"
            onClick={onBack}
            style={{ width: s(36), height: s(36), borderRadius: "50%", background: PAPER, border: `${s(2)} solid ${NAVY}`, boxSizing: "border-box", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}
          >
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(18) }}>{title}</h2>
        </div>
        <PhotoGrid photos={photos} />
        <div ref={end} aria-hidden="true" style={{ height: s(24) }} />
      </div>
    </section>
  );
}
