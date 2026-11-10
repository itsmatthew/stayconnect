import { MemoryArt } from "../home/memory-art";
import type { ArtKind } from "../home/types";

/** A dropped photo filling its box. TODO(server): a stored photo will be an <img>; the demo draws one. */
export function MailPicture({ art, label, height }: { art: ArtKind; label?: string; height: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: "block", width: "100%", height }}
    >
      <MemoryArt kind={art} cx={50} cy={50} R={50} />
    </svg>
  );
}
