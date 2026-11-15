import type { CSSProperties } from "react";
import { MemoryArt } from "../home/memory-art";
import type { PhotoView } from "./types";

/** A post's photo filling its box: your image, or memory art standing in for a placeholder post. */
export function ArchivePhoto({ photo, style }: { photo: PhotoView; style?: CSSProperties }) {
  const box: CSSProperties = { display: "block", width: "100%", height: "100%", objectFit: "cover", ...style };
  if (photo.kind === "art") {
    return (
      <svg role="img" aria-label={photo.alt} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={box}>
        <MemoryArt kind={photo.art} cx={50} cy={50} R={50} />
      </svg>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- a local object URL; next/image can't optimise it.
  return photo.src ? <img src={photo.src} alt={photo.alt} style={box} /> : <span role="img" aria-label={photo.alt} style={{ ...box, background: "#E8D9B4" }} />;
}
